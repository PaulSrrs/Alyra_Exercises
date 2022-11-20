import React, {useReducer, useCallback, useEffect} from "react";
import Web3 from "web3";
import EthContext from "./EthContext";
import {reducer, actions, initialState} from "./state";
import {VotesTallied} from "../../utils/constants";
const artifact = require("../../contracts/Voting.json");

const contractAddress = process.env.REACT_APP_CONTRACT_ADDR;
const {abi} = artifact;
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
const contract = new web3.eth.Contract(abi, contractAddress);

function EthProvider({children}) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const handleAccountsChange = useCallback(async () => {
        if (artifact && contract) {
            const accounts = await web3.eth.getAccounts();
            const owner = await contract.methods.owner().call();
            let isVoter = false;
            let voter;

            if (!!accounts?.length) {
                try {
                    voter = await contract.methods.getVoter(accounts[0]).call({from: accounts[0]});
                    isVoter = voter.isRegistered;
                } catch (e) {
                    console.error(e);
                }
            }

            dispatch({
                type: actions.init,
                data: {
                    accounts,
                    isOwner: accounts[0] === owner,
                    voter,
                    isVoter
                }
            });
        }
    }, []);

    const initContract = useCallback(async () => {
        if (artifact && contract) {
            const networkID = await web3.eth.net.getId();
            try {
                let winningProposalId = 0;
                const accounts = await web3.eth.getAccounts();
                const owner = await contract.methods.owner().call();
                const workflowStatus = await contract.methods.workflowStatus().call();

                if (+workflowStatus === VotesTallied) {
                    winningProposalId = await contract.methods.winningProposalID().call();
                }

                await handleAccountsChange()
                dispatch({
                    type: actions.init,
                    data: {
                        web3,
                        networkID,
                        contract,
                        isOwner: !!accounts?.length ? accounts[0] === owner : false,
                        workflowStatus: +workflowStatus,
                        winningProposalId: +winningProposalId,
                        isWeb3Loading: false
                    }
                });
            } catch (e) {
                dispatch({
                    type: actions.init,
                    data: {
                        web3,
                        networkID,
                        isWeb3Loading: false
                    }
                });
            }
        }
    }, [handleAccountsChange]);

    const handleChainChange = useCallback(async () => {
        initContract().then();
    }, [initContract]);

    useEffect(() => {
        try {
            initContract().then();
        } catch (err) {
            console.error(err);
        }
    }, [initContract]);

    useEffect(() => {
        window.ethereum?.on("accountsChanged", handleAccountsChange);
        window.ethereum?.on("chainChanged", handleChainChange);

        return () => {
            window.ethereum?.removeListener("accountsChanged", handleAccountsChange);
            window.ethereum?.removeListener("chainChanged", handleChainChange);
        };
    }, [handleAccountsChange, handleChainChange]);

    return (
        <EthContext.Provider value={{
            state,
            dispatch
        }}>
            {children}
        </EthContext.Provider>
    );
}

export default EthProvider;
