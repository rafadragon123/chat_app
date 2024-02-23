import React from "react";
import { TextField } from "@mui/material";

export default (props) => {
    const username = props.username
    const message = props.message
    const timestamp = props.timestamp;
    return(
        <div className="message">
            <TextField fullWidth InputProps={{readOnly:true}} variant="outlined" label={username} value={(message!='')?message:' '}></TextField>
        </div>
    )   
}