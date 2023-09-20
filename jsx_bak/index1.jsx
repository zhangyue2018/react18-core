import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));

function FunctionComponent(props) {
    return  <div
                onClick={() => console.log('ParentNodeBubble')}
                onClickCapture={(event) => {
                    console.log('ParentNodeCapture');
                    // event.stopPropagation();
                }}>
                    <div>课程名称：手写React高质量源码迈向高阶开发</div>
                    <div
                        onClick={(event) => {
                            console.log('ChildNodeBubble');
                            event.stopPropagation();
                        }}
                        onClickCapture={() => console.log('ChildNodeCapture')}>讲师：杨艺韬</div>
                    <div>电子书：<a style={{color: 'blue'}} href='#'>aa</a></div>
    </div>
}

root.render(<FunctionComponent />);
console.log('index.jsx', <FunctionComponent />);