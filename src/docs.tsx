import React from 'react';
import {mountPage} from './hydrate';
import Manual from './Manual';
import '../docs-v2.css';
const root=document.getElementById('react-root');
if(!root)throw new Error('Missing React documentation root');
mountPage(root,<Manual/>);
