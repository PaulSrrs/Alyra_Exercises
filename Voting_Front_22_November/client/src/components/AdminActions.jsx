import {useCallback, useMemo, useState} from "react";
import {
    ProposalsRegistrationEnded,
    ProposalsRegistrationStarted,
    RegisteringVoters, VotesTallied, VotingSessionEnded,
    VotingSessionStarted
} from "../utils/constants";
import {toast} from "react-toastify";
import {Button, Grid, Typography} from "@mui/material";
import {LoadingButton} from "@mui/lab";

export default function AdminActions({workflowStatus, setAddVoterOpen, contract, owner, winningProposalId}) {
    const [isLoading, setIsLoading] = useState(false);

    const nextVoteStep = useCallback(async () => {
        setIsLoading(true);
        try {
            switch (workflowStatus) {
                case RegisteringVoters:
                    await contract.methods.startProposalsRegistering().send({from: owner});
                    break;
                case ProposalsRegistrationStarted:
                    await contract.methods.endProposalsRegistering().send({from: owner});
                    break;
                case ProposalsRegistrationEnded:
                    await contract.methods.startVotingSession().send({from: owner});
                    break;
                case VotingSessionStarted:
                    await contract.methods.endVotingSession().send({from: owner});
                    break;
                case VotingSessionEnded:
                    await contract.methods.tallyVotes().send({from: owner});
                    break;
                default:
                    break;
            }
        } catch (e) {
            toast.error('An error has occurred :(')
        } finally {
            setIsLoading(false);
        }
    }, [workflowStatus, contract.methods, owner]);

    const associatedStepText = useMemo(() => {
        switch (workflowStatus) {
            case 0:
                return 'Start proposal registration';
            case 1:
                return 'End proposal registration';
            case 2:
                return 'Start voting session';
            case 3:
                return 'End voting session';
            case 4:
                return 'Tally votes';
            default:
                return '';
        }
    }, [workflowStatus]);

    return <Grid sx={{mt: 2}} container justifyContent={'space-between'}>
        {workflowStatus === RegisteringVoters &&
        <Button variant={'outlined'} color={'success'} onClick={() => setAddVoterOpen(true)}>Add a voter</Button>}
        {workflowStatus < VotesTallied ? <LoadingButton loading={isLoading} variant={'outlined'}
                                                        onClick={() => nextVoteStep()}>{associatedStepText}</LoadingButton> :
            <Typography>
                {winningProposalId !== 0 ? `The winning proposal is : ${winningProposalId ?? '...'} 🏆` : 'There is no winner ❌'}
            </Typography>}
    </Grid>

}
