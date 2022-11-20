import {useCallback} from "react";
import {Box, Card, CardContent, CardHeader, Grid, LinearProgress, Tooltip, Typography} from "@mui/material";
import classes from "./Dapp.module.css";
import formatETHAddress from "../utils/tools";
import {LoadingButton} from "@mui/lab";

export default function VoterList({contract, isVoter, voterAddress, voters, setVoters}) {
    const fetchVoterInfo = useCallback(async (voter) => {
        setVoters(prevState => {
            const t = [...prevState];
            t.splice(voters.findIndex(_voter => _voter.address === voter.address), 1,
                {
                    ...voter,
                    isLoadingInfo: true
                });
            return t
        })
        const data = await contract.methods.getVoter(voter.address).call({from: voterAddress});
        setVoters(prevState => {
            const t = [...prevState];
            t.splice(voters.findIndex(_voter => _voter.address === voter.address), 1,
                {
                    ...voter,
                    hasVoted: data?.hasVoted,
                    votedProposalId: data?.votedProposalId,
                    isLoadingInfo: false
                });
            return t
        })
    }, [contract, setVoters, voters, voterAddress]);

    if (!voters) {
        return <Grid container>
            <Box sx={{width: '100%'}}>
                <LinearProgress/>
            </Box>
        </Grid>
    } else if (!voters.length) {
        return <Grid container>
            <Typography>There is no voters yet.</Typography>
        </Grid>
    } else {
        return <Grid container spacing={4}>
            {voters.map(voter => <Grid key={voter.address} container item xs={12} lg={4}>
                <Card className={classes.proposalCard}
                      sx={{
                          width: '100%'
                      }}>
                    <CardHeader titleTypographyProps={{sx: {fontSize: 16}}}
                                title={isVoter ? <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Tooltip title={voter.address}>
                                        <Typography
                                            sx={{color: voterAddress === voter.address ? 'green' : 'inherit'}}>{formatETHAddress(voter.address)}</Typography>
                                    </Tooltip>
                                </Box> : <></>}>
                    </CardHeader>
                    <CardContent sx={{height: '100px'}}>
                        {isVoter ? <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {voter.votedProposalId ?
                                <Tooltip title={voter.hasVoted ? 'Has voted !' : "Hasn't voted yet."}>
                                    {voter.votedProposalId !== '0' ?
                                        <Typography>🗳 : {voter.votedProposalId}</Typography> :
                                        <Typography>🗳 : ❌</Typography>}
                                </Tooltip> :
                                <LoadingButton loading={voter.isLoadingInfo}
                                               onClick={() => fetchVoterInfo(voter)}>
                                    Get info
                                </LoadingButton>}
                        </Box> : <Tooltip title={voter.address}>
                            <Typography
                                sx={{
                                    textAlign: 'center',
                                    color: voterAddress === voter.address ? 'green' : 'inherit'
                                }}>{formatETHAddress(voter.address)}</Typography>
                        </Tooltip>}
                    </CardContent>
                </Card>
            </Grid>)}
        </Grid>
    }
}
