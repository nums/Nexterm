import { useEffect, useRef, useContext } from "react";
import { UserContext } from "@/common/contexts/UserContext.jsx";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit/src/FitAddon";

import "xterm/css/xterm.css";
import "./styles/xterm.sass";

const XtermRenderer = ({ session, disconnectFromServer, pve }) => {
    const ref = useRef(null);
    const { sessionToken } = useContext(UserContext);

    useEffect(() => {
        if (!sessionToken) return;

        const term = new Xterm({
            cursorBlink: true,
            fontSize: 16,
            fontFamily: "monospace",
            theme: { background: "#13181C" },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(ref.current);

        const handleResize = () => {
            fitAddon.fit();
            ws.send(`\x01${term.cols},${term.rows}`);
        };

        window.addEventListener("resize", handleResize);

        const protocol = location.protocol === "https:" ? "wss" : "ws";

        let url;
        let ws;

        console.log(import.meta.env)
        
        if (pve) {
            url = process.env.NODE_ENV === "production" ? `${window.location.host}/api/servers/pve-lxc` : `${import.meta.env.VITE_WS_DOMAIN}:${import.meta.env.VITE_WS_PORT}/api/servers/pve-lxc`;
            ws = new WebSocket(`${protocol}://${url}?sessionToken=${sessionToken}&serverId=${session.server}&containerId=${session.containerId}`);
        } else {
            url = process.env.NODE_ENV === "production" ? `${window.location.host}/api/servers/sshd` : `${import.meta.env.VITE_WS_DOMAIN}:${import.meta.env.VITE_WS_PORT}/api/servers/sshd`;
            ws = new WebSocket(`${protocol}://${url}?sessionToken=${sessionToken}&serverId=${session.server}&identityId=${session.identity}`);
        }

        let interval = setInterval(() => {
            if (ws.readyState === ws.OPEN) handleResize();
        }, 300);

        ws.onopen = () => {
            ws.send(`\x01${term.cols},${term.rows}`);
        }

        ws.onclose = (event) => {
            if (event.wasClean) {
                clearInterval(interval);
                disconnectFromServer(session.id);
            }
        };

        ws.onmessage = (event) => {
            const data = event.data;

            if (data.startsWith("\x02")) {
                const prompt = data.substring(1);
                term.write(prompt);

                let totpCode = "";
                const onKey = term.onKey((key) => {
                    if (key.domEvent.key === "Enter") {
                        ws.send(`\x03${totpCode}`);
                        term.write("\r\n");
                        totpCode = "";
                        onKey.dispose();
                    } else if (key.domEvent.key === "Backspace" && totpCode.length > 0) {
                        totpCode = totpCode.slice(0, -1);
                        term.write("\b \b");
                    } else {
                        totpCode += key.key;
                        term.write(key.key);
                    }
                });
            } else {
                term.write(data);
            }
        };

        term.onData((data) => {
            ws.send(data);
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            ws.close();
            term.dispose();
            clearInterval(interval);
        };
    }, [sessionToken]);

    return (
        <div ref={ref} style={{ width: "100%", height: "98%" }} />
    );
};

export default XtermRenderer;
