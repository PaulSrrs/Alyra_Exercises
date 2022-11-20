import {Button, Grid, Typography} from "@mui/material";

export default function VoterActions({
                          workflowStatus,
                          setAddProposalOpen,
                          voter,
                          winningProposalId
                      }) {
    switch (workflowStatus) {
        case 0:
            return <Typography sx={{textAlign: 'center', mt: 2}}>Wait for voter registration to end.</Typography>
        case 1:
            return <Grid sx={{mt: 2}} container justifyContent={'space-between'}>
                <Button variant={'outlined'} onClick={() => setAddProposalOpen(true)}>Add proposal</Button>
            </Grid>
        case 2:
            return <Typography sx={{textAlign: 'center', mt: 2}}>Wait for the administrator to start voting
                session...</Typography>
        case 3:
            return <Typography sx={{
                textAlign: 'center',
                mt: 2
            }}>{voter.hasVoted ? `You voted for proposal ${voter.votedProposalId} !` : 'You can now vote for your favorite proposal.'}</Typography>
        case 4:
            return <Typography sx={{textAlign: 'center', mt: 2}}>Wait for the administrator to count the
                votes...</Typography>
        case 5:
            return <Typography sx={{mt: 2}}>
                {winningProposalId !== 0 ? `The winning proposal is : ${winningProposalId ?? '...'} 🏆` : 'There is no winner ❌'}
            </Typography>
        default:
            return <></>
    }
}
