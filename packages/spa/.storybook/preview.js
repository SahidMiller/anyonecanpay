import "../public/css/client.css";

import { Buffer } from 'buffer'
globalThis.Buffer = Buffer
import process from "process/browser"
globalThis.process = process

globalThis.global = globalThis;