import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
   
    return  <button onClick={ () => {
    }}>{1}</button>
}

const root = createRoot(document.getElementById('root'));
root.render(<FunctionComponent />);
console.log('index.jsx', <FunctionComponent />);