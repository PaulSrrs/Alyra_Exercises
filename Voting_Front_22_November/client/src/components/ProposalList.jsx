import {useCallback, useState} from "react";
import {toast} from "react-toastify";
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Grid,
    LinearProgress,
    Tooltip,
    Typography
} from "@mui/material";
import classes from "./Dapp.module.css";
import {LoadingButton} from "@mui/lab";
import {actions} from "../contexts/EthContext";

export default function ProposalList({
                                         contract,
                                         voterAddress,
                                         voter,
                                         workflowStatus,
                                         proposals,
                                         setProposals,
                                         setProposalDetail,
                                         dispatch
                                     }) {
    const [proposalVoteLoading, setProposalVoteLoading] = useState(false);

    const fetchDescription = useCallback(async (proposal) => {
        setProposals(prevState => {
            const t = [...prevState];
            t.splice(+(proposal.id - 1), 1,
                {
                    ...proposal,
                    isLoadingDescription: true
                });
            return t
        })
        const data = await contract.methods.getOneProposal(proposal.id).call({from: voterAddress});
        setProposals(prevState => {
            const t = [...prevState];
            t.splice(+(proposal.id - 1), 1,
                {
                    ...proposal,
                    isLoadingDescription: false,
                    description: data.description,
                    voteCount: data.voteCount
                });
            return t
        })
    }, [contract, setProposals, voterAddress]);

    const voteForProposal = useCallback(async (e, proposalId) => {
        e.stopPropagation();
        setProposalVoteLoading(true);
        try {
            await contract.methods.setVote(proposalId).send({from: voterAddress});
            dispatch({
                type: actions.init,
                data: {
                    voter: {
                        ...voter,
                        hasVoted: true,
                        votedProposalId: proposalId

                    }
                }
            });
            toast.success(`You voted for proposal ${proposalId}`)
        } catch (e) {
            toast.error('An error occurred :(')
        } finally {
            setProposalVoteLoading(false);
        }
    }, [contract.methods, voterAddress, voter, dispatch])

    if (!proposals) {
        return <Grid container>
            <Box sx={{width: '100%'}}>
                <LinearProgress/>
            </Box>
        </Grid>
    } else if (!proposals.length) {
        return <Grid container>
            <Typography>There is no proposal yet.</Typography>
        </Grid>
    } else {
        return <Grid container spacing={4}>
            {proposals.map(proposal => <Grid key={proposal.id} container item xs={12} lg={4}>
                <Card className={classes.proposalCard} onClick={() => setProposalDetail(proposal.description ?? '')}
                      sx={{
                          width: '100%',
                          '&:hover': proposal.description ? {
                              transform: 'scale(1.02)',
                              cursor: 'pointer'
                          } : ''
                      }}>
                    <CardHeader titleTypographyProps={{sx: {fontSize: 16}}}
                                title={<Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography>Id: {proposal.id}</Typography>
                                    <Box sx={{display: 'flex'}}>
                                        {proposal.voteCount !== undefined &&
                                        <Typography>Votes: {proposal.voteCount}</Typography>}
                                        {+voter?.votedProposalId === +proposal.id &&
                                        <Tooltip title={'You have voted for this proposal'}>
                                            <Typography sx={{marginLeft: 1}}>🗳</Typography>
                                        </Tooltip>}
                                    </Box>
                                </Box>}>

                    </CardHeader>
                    <CardContent sx={{height: '100px'}}>
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {proposal.description ?
                                <Typography sx={{
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: '3',
                                    overflow: 'hidden'
                                }}>{proposal.description}</Typography> :
                                <LoadingButton loading={proposal.isLoadingDescription}
                                               onClick={() => fetchDescription(proposal)}>
                                    Get info
                                </LoadingButton>}
                        </Box>
                    </CardContent>
                    {workflowStatus === 3 && !voter.hasVoted && <CardActions>
                        <LoadingButton onClick={(e) => voteForProposal(e, proposal.id)} sx={{width: '100%'}}
                                       color={'success'} variant={'contained'} loading={proposalVoteLoading}>
                            Vote for this proposal
                        </LoadingButton>

                    </CardActions>}
                </Card>
            </Grid>)}
        </Grid>
    }
}
