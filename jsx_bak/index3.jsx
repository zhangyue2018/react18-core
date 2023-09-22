import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
    const [number, setAge] = React.useState(0);

    return  <button onClick={ () => {
        setAge(number + 1);
    }}>{number}</button>
}

const root = createRoot(document.getElementById('root'));
root.render(<FunctionComponent />);
console.log('index.jsx', <FunctionComponent />);