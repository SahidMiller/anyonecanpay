import { Buffer } from 'buffer'
globalThis.Buffer = Buffer
import process from "process/browser"
globalThis.process = process

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import * as idb from "idb-keyval";
window.idb = idb;

import('./index.jsx');