import React, {useState} from "react";

function Counter() {

    const [count , setCount] = useState(0);

    return (
        <div>

        <p>当前计数: {count}</p>
        <button onClick={ () => setCount(count+1)}>
            点击+1
            </button>   
        </div>
    );

}

export default Counter