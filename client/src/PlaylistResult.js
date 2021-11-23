import React from "react";

export default function PlaylistResult({ playlist, isTrackIncluded }) {
    if(isTrackIncluded){
        return <div className="d-flex m-2 align-items-center">
        <div className="m1-3">
            <div><b>{playlist.name}</b></div>
        </div>
    </div>
    }else{
        return <div className="d-flex m-2 align-items-center">
        <div className="m1-3">
            <div>{playlist.name}</div>
        </div>
    </div>
    }

}