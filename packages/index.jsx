import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
    const [number, setAge] = React.useState(0);
    const [name, setName] = React.useState('zy');

    React.useLayoutEffect(() => {
        console.log('create--useLayoutEffects');
        return () => {
            console.log('destroy---useLayoutEffects');
        }
    }, [number]);

    React.useEffect(() => {
        console.log('create--useEffects---1111');
        return () => {
            console.log('destroy---useEffects---222');
        }
    }, [number]);

    return  <button onClick={ () => {
        setAge(number + 1);
    }}>{number}</button>
}

const root = createRoot(document.getElementById('root'));
root.render(<FunctionComponent />);
console.log('index.jsx', <FunctionComponent />);