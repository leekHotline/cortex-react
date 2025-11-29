import React, {useState} from "react";

function Counter() {

    const [count , setCount] = useState(0);

    return (
        <div>

        <p>当前计数: {count}</p>
        <button onClick={ () => setCount(count+1)}>
            点击+1
            </button>   
        <button onClick={ () => setCount(count+2)}>
            点击+2
        </button>
        </div>
        
     


    );

}

export default Counter