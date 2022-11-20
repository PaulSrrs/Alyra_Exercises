import {Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {LoadingButton} from "@mui/lab";

export default function AddVoterDialog({addVoterOpen, voterAddress, fieldError, setVoterAddress, addVoter, isLoading, setAddVoterOpen}) {
    return <Dialog fullWidth
            maxWidth="sm"
            open={addVoterOpen}>
        <DialogTitle>
            <Box display="flex" alignItems="center">
                <Box flexGrow={1}>Add a voter</Box>
                <Box>
                    <IconButton color={'error'} onClick={() => setAddVoterOpen(false)}>
                        <CloseIcon/>
                    </IconButton>
                </Box>
            </Box>
        </DialogTitle>
        <DialogContent>
            <TextField
                sx={{mt: 2}}
                value={voterAddress}
                onChange={e => setVoterAddress(e.target.value)}
                fullWidth
                label={'Voter address'}
                error={!!fieldError}
                helperText={fieldError}
                required
            >

            </TextField>
        </DialogContent>
        <DialogActions>
            <LoadingButton variant={'outlined'} onClick={() => addVoter()} loading={isLoading}
                           disabled={!voterAddress || !!fieldError}>
                Add voter
            </LoadingButton>
        </DialogActions>
    </Dialog>
}
