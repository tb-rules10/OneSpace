import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import '@styles/xterm.css';
import {io} from 'socket.io-client'


const url = "http://localhost:5000"
const socket = io(url);

const Terminal = ( ) => {

    const terminalRef = useRef();
    const isRendered = useRef(false);

    useEffect(() => {
        if(isRendered.current)  return;
        isRendered.current = true;

        const term = new XTerminal({
            rows: 18,
        });

        term.open(terminalRef.current);

        term.onData(data => {
            socket.emit('terminal:write', data);
        });

        socket.on('terminal:data', (data) => {
            term.write(data);
        });

        // return () => {
        //     socket.off('terminal:data');
        // };
    }, []);

    return (
        <div ref={terminalRef} className=' '/>
    )
}

export default Terminal
