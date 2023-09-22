import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
    const [number, setAge] = React.useState(0);
    const [name, setName] = React.useState('zy');

    React.useEffect(() => {
        console.log('create');
        return () => {
            console.log('destroy');
        }
    });

    React.useEffect(() => {
        console.log('create1');
        return () => {
            console.log('destroy1');
        }
    });

    return  <button onClick={ () => {
        setAge(number + 1);
    }}>{number}</button>
}

const root = createRoot(document.getElementById('root'));
root.render(<FunctionComponent />);
console.log('index.jsx', <FunctionComponent />);