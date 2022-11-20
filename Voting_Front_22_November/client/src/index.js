import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {EthProvider} from "./contexts/EthContext";
import App from "./App";
import {ThemeProvider} from "@emotion/react";
import {Box, Button, createTheme, CssBaseline, Grid, Typography, Link} from "@mui/material";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <EthProvider>
                {window.ethereum ? <App/> : <Grid sx={{height: '100%'}} justifyContent={'center'} alignItems={'center'} container>
                    <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                        <Typography>You must install metamask to use this application.</Typography>
                        <Link href={'https://metamask.io/download/'} target={'_blank'}>
                            <Button sx={{mt: 2}} variant={'outlined'}>Install metamask</Button>
                        </Link>
                    </Box>
                </Grid>}
            </EthProvider>
        </ThemeProvider>
    </React.StrictMode>
);
