import {Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {LoadingButton} from "@mui/lab";

export default function AddProposalDialog({addProposalOpen, setAddProposalOpen, setVoterProposal, addProposal, isLoading, voterProposal}) {
    return <Dialog fullWidth
                   maxWidth="sm"
                   open={addProposalOpen}>
        <DialogTitle>
            <Box display="flex" alignItems="center">
                <Box flexGrow={1}>Add a proposal</Box>
                <Box>
                    <IconButton color={'error'} onClick={() => setAddProposalOpen(false)}>
                        <CloseIcon/>
                    </IconButton>
                </Box>
            </Box>
        </DialogTitle>
        <DialogContent>
            <TextField
                sx={{mt: 2}}
                multiline
                minRows={3}
                maxRows={8}
                value={voterProposal}
                onChange={e => setVoterProposal(e.target.value)}
                fullWidth
                label={'Your proposal'}
                required
            >

            </TextField>
        </DialogContent>
        <DialogActions>
            <LoadingButton variant={'outlined'} onClick={() => addProposal()} loading={isLoading}
                           disabled={!voterProposal}>
                Add proposal
            </LoadingButton>
        </DialogActions>
    </Dialog>
}
