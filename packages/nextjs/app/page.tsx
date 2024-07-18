"use client";

import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Contract, ethers } from "ethers";
import type { NextPage } from "next";
import { ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const CONTRACT_ABI = deployedContracts[11155111].IdentityVerification.abi;
const CONTRACT_ADDRESS = deployedContracts[11155111].IdentityVerification.address;

interface Identity {
  user: string;
  isVerified: boolean;
  exists: boolean;
  name: string;
  email: string;
}

/**
 * The Home component manages user identity interactions, including fetching, submitting,
 * updating, verifying, and revoking identity on both a smart contract and XRPL.
 *
 * @component
 */
const Home: NextPage = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isIdentityFetched, setIsIdentityFetched] = useState(false);

  /**
   * Initializes the Ethereum provider, signer, and contract, then fetches the user's identity.
   */
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
        const account = await signer.getAddress();
        setAccount(account);
        fetchIdentity(account);
      }
    };
    init();
  }, [account]);

  const { writeContractAsync: addIdentity } = useScaffoldWriteContract("IdentityVerification");
  const { writeContractAsync: updateIdentity } = useScaffoldWriteContract("updateIdentity");
  const { writeContractAsync: verifyIdentity } = useScaffoldWriteContract("verifyIdentity");
  const { writeContractAsync: revokeIdentity } = useScaffoldWriteContract("revokeIdentity");

  /**
   * Displays a toast notification.
   * @param {string} message - The message to display.
   * @param {TypeOptions} [type="info"] - The type of notification ("info", "success", "error", etc.).
   */
  const notify = (message: string, type: TypeOptions = "info") => {
    toast(message, { type });
  };

  /**
   * Fetches the user's identity from the smart contract and XRPL.
   * @param {string} account - The user's Ethereum account address.
   */
  const fetchIdentity = async (account: string) => {
    try {
      const identity = await contract?.getIdentity(account);
      if (identity.exists) {
        setName(identity.name);
        setEmail(identity.email);
        setIdentity(identity);
        setIsIdentityFetched(true);
        notify("Identity fetched successfully", "success");
      } else {
        notify("No identity found on contract", "info");
      }
    } catch (error) {
      notify("Failed to fetch identity", "error");
    }
  };

  /**
   * Submits a new identity to the smart contract.
   */
  const submitIdentity = async () => {
    try {
      await addIdentity({
        functionName: "addIdentity",
        args: [name, email],
      });
      notify("Identity added successfully", "success");
      fetchIdentity(account); // Refresh identity after submission
    } catch (error) {
      console.log(error);
      notify("Failed to add identity", "error");
    }
  };

  /**
   * Updates the user's identity on the smart contract and XRPL.
   */
  const identityUpdate = async () => {
    try {
      await updateIdentity({
        functionName: "updateIdentity",
        args: [name, email],
      });
      notify("Identity updated successfully", "success");
      fetchIdentity(account); // Refresh identity after update
    } catch (error) {
      notify("Failed to update identity", "error");
    }
  };

  /**
   * Verifies the user's identity on the smart contract and logs the action on XRPL.
   */
  const identityVerify = async () => {
    try {
      await verifyIdentity({
        functionName: "verifyIdentity",
      });
      notify("Identity verified successfully", "success");
      fetchIdentity(account); // Refresh identity after verification
    } catch (error) {
      console.log(error);
      notify("Failed to verify identity", "error");
    }
  };

  /**
   * Revokes the user's identity on the smart contract and logs the action on XRPL.
   */
  const identityRevoke = async () => {
    try {
      await revokeIdentity({
        functionName: "revokeIdentity",
      });
      notify("Identity revoked successfully", "success");
      fetchIdentity(account); // Refresh identity after revoke
    } catch (error) {
      notify("Failed to revoke identity", "error");
    }
  };

  const isVerified = identity ? identity.isVerified : false;
  const exists = identity ? identity.exists : false;

  return (
    <div className="container mt-5">
      <ToastContainer />
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1>Identity Verification</h1>
        {account ? (
          <button className="btn btn-secondary">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => window.ethereum.request({ method: "eth_requestAccounts" })}
          >
            Connect Wallet
          </button>
        )}
      </header>
      <div className="card p-4">
        <div className="form-group">
          <label>Name:</label>
          <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {identity && (
          <div className="mt-3">
            <div className="card">
              <div className="card-header">Identity Information</div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>User Address:</strong> {identity.user}
                </li>
                <li className="list-group-item">
                  <strong>Verified:</strong> {identity.isVerified ? "Yes" : "No"}
                </li>
                <li className="list-group-item">
                  <strong>Exists:</strong> {identity.exists ? "Yes" : "No"}
                </li>
              </ul>
            </div>
          </div>
        )}
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-primary" onClick={submitIdentity} disabled={isIdentityFetched}>
            Submit Identity
          </button>
          <button className="btn btn-warning" onClick={identityUpdate} disabled={!isIdentityFetched}>
            Update Identity
          </button>
          <button className="btn btn-success" onClick={identityVerify} disabled={!isIdentityFetched || isVerified}>
            Verify Identity
          </button>
          <button className="btn btn-danger" onClick={identityRevoke} disabled={!isIdentityFetched || !exists}>
            Revoke Identity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
