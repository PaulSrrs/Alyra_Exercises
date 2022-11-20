import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Typography,
    Tab,
    Paper
} from "@mui/material";
import {useCallback, useEffect, useMemo, useState} from "react";
import Web3 from "web3";
import {TabContext, TabList, TabPanel} from "@mui/lab";
import CloseIcon from '@mui/icons-material/Close';
import {actions} from "../contexts/EthContext";
import {toast} from "react-toastify";
import {
    ProposalsRegistrationEnded,
    ProposalsRegistrationStarted,
    VotesTallied, VotingSessionEnded,
    VotingSessionStarted
} from "../utils/constants";
import formatETHAddress from "../utils/tools";
import AdminActions from "./AdminActions";
import VoterList from "./VoterList";
import ProposalList from "./ProposalList";
import VoterActions from "./VoterActions";
import AddVoterDialog from "../dialogs/AddVoterDialog";
import AddProposalDialog from "../dialogs/AddProposalDialog";

function DApp({contract, accounts, isOwner, isVoter, voter, workflowStatus, winningProposalId, dispatch}) {
    const [proposals, setProposals] = useState(null);
    const [voters, setVoters] = useState(null);
    const [addVoterOpen, setAddVoterOpen] = useState(false);
    const [addProposalOpen, setAddProposalOpen] = useState(false);
    const [voterProposal, setVoterProposal] = useState('');
    const [voterAddress, setVoterAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [proposalDetail, setProposalDetail] = useState('');
    const [tab, setTab] = useState(isOwner ? 'voters' : (workflowStatus >= 1 ? 'proposals' : 'voters'));

    const handleTabChange = (_, newTabValue) => {
        setTab(newTabValue);
    }

    const fetchProposals = useCallback(async () => {
        try {
            setProposals(null);
            const proposalsEvt = await contract.getPastEvents('ProposalRegistered', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            setProposals(proposalsEvt.map(proposalEvt => {
                return {id: proposalEvt.returnValues?.proposalId, description: null, isLoadingDescription: false}
            }));
        } catch (e) {
            console.error(e);
        }
    }, [contract, setProposals]);

    const fetchVoters = useCallback(async () => {
        try {
            setVoters(null);
            const votersEvt = await contract.getPastEvents('VoterRegistered', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            setVoters(votersEvt.map(voter => {
                return {
                    address: voter.returnValues?.voterAddress,
                    hasVoted: false,
                    votedProposalId: null,
                    isLoadingInfo: false
                }
            }));
        } catch (e) {
            console.error(e);
        }
    }, [contract, setVoters]);

    useEffect(() => {
        (async () => {
            await fetchProposals();
            await fetchVoters();
        })();

        const proposalsRegistrationCallback = event => {
            if (isVoter) {
                toast.info(`New proposal (id: ${event.returnValues.proposalId}).`, {
                    position: "bottom-right",
                    toastId: event.id
                })
                fetchProposals().then();
            }
        }
        const proposalRegistrationSubscriber = contract.events.ProposalRegistered({fromBlock: 'latest'});
        proposalRegistrationSubscriber.on('data', proposalsRegistrationCallback);

        const votedRegistrationCallback = async event => {
            const isActualConnected = event.returnValues.voterAddress === accounts[0];
            if (isVoter || isOwner || isActualConnected) {
                const ethAddress = formatETHAddress(event.returnValues.voterAddress);
                toast.info(`New voter registered (${ethAddress}).`, {
                    position: "bottom-right",
                    toastId: event.id
                })
                fetchVoters().then();
            }
            if (isActualConnected) {
                const voter = await contract.methods.getVoter(accounts[0]).call({from: accounts[0]});
                dispatch({
                    type: actions.init,
                    data: {
                        voter,
                        isVoter: true
                    }
                })
            }
        };
        const voterRegistrationSubscriber = contract.events.VoterRegistered({fromBlock: 'latest'});
        voterRegistrationSubscriber.on('data', votedRegistrationCallback)

        const hasVotedCallback = event => {
            if (isVoter) {
                const ethAddress = formatETHAddress(event.returnValues.voter);
                const proposalId = event.returnValues.proposalId;

                if (event.returnValues.voter !== accounts[0]) {
                    toast.info(`Voter (${ethAddress}) vote for proposal ${proposalId}.`, {
                        position: "bottom-right",
                        toastId: event.id
                    })
                }
                fetchProposals().then();
                fetchVoters().then();
            }
        }
        const hasVotedSubscriber = contract.events.Voted({fromBlock: 'latest'});
        hasVotedSubscriber.on('data', hasVotedCallback)

        const workflowCallback = async event => {
            let data = {};
            data.workflowStatus = +event.returnValues.newStatus;
            console.log(event);
            switch (+event.returnValues.newStatus) {
                case ProposalsRegistrationStarted:
                    toast.success("Proposal registration has started 📩 !", {toastId: event.id})
                    break;
                case ProposalsRegistrationEnded:
                    toast.warn("Proposal registration has ended 📩 !", {toastId: event.id});
                    break;
                case VotingSessionStarted:
                    toast.success("Voting session has started 🗳 !", {toastId: event.id})
                    break;
                case VotingSessionEnded:
                    toast.warn("Voting session has ended 🗳 !", {toastId: event.id})
                    break;
                case VotesTallied:
                    data.winningProposalId = +(await contract.methods.winningProposalID().call({from: accounts[0]}));
                    toast.success("Votes has been tallied ! And the winner is... 🏆", {toastId: event.id})
                    break;
                default:
                    break;
            }
            dispatch({
                type: actions.init,
                data: {
                    ...data
                }
            })
        }
        const workflowStatusSubscriber = contract.events.WorkflowStatusChange({fromBlock: 'latest'});
        workflowStatusSubscriber.on('data', workflowCallback)
        return () => {
            proposalRegistrationSubscriber.off('data', proposalsRegistrationCallback);
            voterRegistrationSubscriber.off('data', votedRegistrationCallback);
            hasVotedSubscriber.off('data', hasVotedCallback);
            workflowStatusSubscriber.off('data', workflowCallback);
        }
    }, [contract, dispatch, accounts, fetchProposals, fetchVoters, isOwner, isVoter]);

    const addProposal = useCallback(async () => {
        setIsLoading(true);
        try {
            await contract.methods.addProposal(voterProposal).send({from: accounts[0]});
            setVoterProposal('');
        } catch (e) {
            toast.error('An error occurred :(')
        } finally {
            setIsLoading(false);
        }
    }, [contract, setIsLoading, voterProposal, accounts]);

    const addVoter = useCallback(async () => {
        setIsLoading(true);
        try {
            await contract.methods.addVoter(voterAddress).send({from: accounts[0]});
            setVoterAddress('');
            if (voterAddress === accounts[0]) {
                dispatch({
                    type: actions.init,
                    data: {
                        isVoter: true
                    }
                })
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [contract, voterAddress, setIsLoading, accounts, dispatch]);

    const fieldError = useMemo(() => {
        if (!voterAddress)
            return false;
        if (voters?.find(voter => voter.address === voterAddress)) {
            return 'Voter already registered';
        } else {
            return !Web3.utils.isAddress(voterAddress) ? "This isn't a valid address" : false;
        }
    }, [voterAddress, voters]);

    return <TabContext value={tab}>
        <Grid container rowSpacing={4} justifyContent={'center'} alignItems={'center'}>
            {isOwner && <Grid item xs={12} lg={8}>
                <Paper sx={{background: 'rgb(39, 39, 39)', borderRadius: 4, padding: 2}} elevation={2}>
                    <Typography sx={{textAlign: 'center'}} variant={'h6'}>You are the administrator of the
                        contract</Typography>
                    <Typography sx={{textAlign: 'center', wordBreak: 'break-all'}}>{accounts[0]}</Typography>
                    <AdminActions workflowStatus={workflowStatus} setAddVoterOpen={setAddVoterOpen} contract={contract}
                                  owner={accounts[0]} winningProposalId={winningProposalId}/>
                </Paper>
            </Grid>}
            {isVoter && <Grid item xs={12} lg={8}>
                <Paper sx={{background: 'rgb(39, 39, 39)', borderRadius: 4, padding: 2}} elevation={2}>
                    <Typography sx={{textAlign: 'center'}} variant={'h6'}>You are a voter of the contract</Typography>
                    <Typography sx={{textAlign: 'center', wordBreak: 'break-all'}}>{accounts[0]}</Typography>
                    <VoterActions workflowStatus={workflowStatus}
                                  setAddProposalOpen={setAddProposalOpen}
                                  voter={voter}
                                  winningProposalId={winningProposalId}/>
                </Paper>
            </Grid>}
            {(!isVoter && !isOwner) && <Grid item xs={12} lg={8}>

                <Paper sx={{background: 'rgb(39, 39, 39)', borderRadius: 4, padding: 2}} elevation={2}>
                    <Typography sx={{textAlign: 'center'}} variant={'h6'}>You are not allowed to vote :(</Typography>
                    <Typography sx={{textAlign: 'center', wordBreak: 'break-all'}}>{accounts[0]}</Typography>
                </Paper>
            </Grid>}
            {(isVoter || isOwner) && <Grid item xs={12} lg={8}>
                <TabList onChange={handleTabChange}>
                    <Tab label="Voter List" value={'voters'}/>
                    {isVoter && workflowStatus >= 1 && <Tab label="Proposal List" value={'proposals'}/>}
                </TabList>
            </Grid>}

            <Grid item xs={12} style={{paddingTop: 0}}>
                {isVoter && workflowStatus >= 1 && <TabPanel value={'proposals'}>
                    <ProposalList contract={contract}
                                  voterAddress={accounts[0]}
                                  voter={voter}
                                  workflowStatus={workflowStatus}
                                  proposals={proposals}
                                  dispatch={dispatch}
                                  setProposalDetail={setProposalDetail}
                                  setProposals={setProposals}/>
                </TabPanel>}

                {(isVoter || isOwner) && <TabPanel value={'voters'}>
                    <VoterList contract={contract}
                               isVoter={isVoter}
                               voterAddress={accounts[0]}
                               voters={voters}
                               setVoters={setVoters}/>
                </TabPanel>}
            </Grid>

            {isOwner && <form onSubmit={() => addVoter()}>
                <AddVoterDialog addVoterOpen={addVoterOpen}
                                voterAddress={voterAddress}
                                fieldError={fieldError}
                                setVoterAddress={setVoterAddress}
                                addVoter={addVoter}
                                isLoading={isLoading}
                                setAddVoterOpen={setAddVoterOpen}/>

            </form>}

            {isVoter && <form onSubmit={() => addProposal()}>
                <AddProposalDialog
                    addProposalOpen={addProposalOpen}
                    setAddProposalOpen={setAddProposalOpen}
                    setVoterProposal={setVoterProposal}
                    addProposal={addProposal}
                    isLoading={isLoading}
                    voterProposal={voterProposal}/>
            </form>}

            {(isOwner || isVoter) && <Dialog fullWidth
                                             maxWidth="sm"
                                             open={!!proposalDetail}>
                <DialogTitle>
                    <Box display="flex" justifyContent="flex-end">
                        <IconButton color={'error'} onClick={() => setProposalDetail('')}>
                            <CloseIcon/>
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>{proposalDetail}</Typography>
                </DialogContent>
            </Dialog>}
        </Grid>
    </TabContext>
}

export default DApp;
