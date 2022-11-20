import {actions, useEth} from "./contexts/EthContext";
import style from "./App.module.css";
import {AppBar, Box, Button, CircularProgress, Grid, Toolbar, Typography} from "@mui/material";
import {useMemo, useState} from "react";
import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer} from "react-toastify";
import DApp from "./components/DApp";

const workflowStatusArray = [
    'Voter registration ✅',
    'Proposal registration ✅',
    'Proposal registration end ❌',
    'Voting sessions ✅',
    'Voter registration ❌',
    'Vote tally ✅'
]

function WorkflowStatus({isLoading, workflowStatus}) {
    return !isLoading && workflowStatus !== null ? <Typography sx={{fontSize: 20}}
                                                               className={style.actualWorkflow}>{workflowStatusArray[workflowStatus]}</Typography> : <></>
}

function App() {
    const [errorMessage, setErrorMessage] = useState('');
    const {
        state: {
            web3,
            contract,
            accounts,
            isWeb3Loading,
            networkID,
            isOwner,
            isVoter,
            voter,
            workflowStatus,
            winningProposalId
        },
        dispatch
    } = useEth();
    const [isLoading, setIsLoading] = useState(false);

    const requestAccounts = async () => {
        try {
            setIsLoading(true);
            const accounts = await web3?.eth.requestAccounts();
            dispatch({
                type: actions.init,
                data: {accounts}
            });
        } catch (e) {
            setErrorMessage(e.message);
        } finally {
            setIsLoading(false);
        }
    }

    const switchNetwork = async () => {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: web3.utils.toHex(5)}]
        });
    }

    const isGoodNetwork = useMemo(() => {
        return process.env.NODE_ENV === 'development' ? (networkID === 5777) : (networkID === 5);
    }, [networkID]);

    return (
        <div id="App">
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <AppBar position={'static'}>
                <Box sx={{maxWidth: 1024, mx: 'auto', width: '100%'}}>
                    <Toolbar>
                        <Grid container justifyContent={'space-between'}>
                            <Typography variant="h6">
                                Voting.sol
                            </Typography>
                            <WorkflowStatus isLoading={isWeb3Loading || isLoading} workflowStatus={workflowStatus}/>
                        </Grid>
                    </Toolbar>
                </Box>
            </AppBar>
            <main>
                <Box className={style.mainCtn}>
                    <Grid container justifyContent={'center'} item xs={12}>
                        {(isWeb3Loading || isLoading) ? <CircularProgress/> :
                            <Grid item xs={12}>
                                {isGoodNetwork ? (!accounts?.length ?
                                        <Grid container direction={'column'} alignItems={'center'}>
                                            <Button variant={'contained'}
                                                    sx={{display: 'block', maxWidth: '200px'}}
                                                    onClick={() => requestAccounts()}>
                                                Connect wallet
                                            </Button>
                                            {errorMessage &&
                                            <Typography sx={{color: 'red', mt: 1}}>{errorMessage}</Typography>}
                                        </Grid> :
                                        (contract ? <DApp contract={contract}
                                                          accounts={accounts}
                                                          dispatch={dispatch}
                                                          isOwner={isOwner}
                                                          isVoter={isVoter}
                                                          voter={voter}
                                                          workflowStatus={workflowStatus}
                                                          winningProposalId={winningProposalId}/> :
                                            <Typography sx={{color: 'red'}}>No contract found.</Typography>)
                                ) : <Grid container direction={'column'}
                                          alignItems={'center'}>{(process.env.NODE_ENV !== 'development' ?
                                    <Button variant={'contained'}
                                            sx={{display: 'block', maxWidth: '300px'}}
                                            onClick={() => switchNetwork()}>
                                        Switch to Goerli network
                                    </Button> : <Typography sx={{color: 'red', textAlign: 'center'}}>You have to switch to
                                        localhost:8545.</Typography>)}</Grid>
                                }
                            </Grid>
                        }
                    </Grid>
                </Box>
            </main>
        </div>
    );
}

export default App;
