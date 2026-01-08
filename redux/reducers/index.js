import {combineReducers} from 'redux'; 
import cartReducer from './cartReducer';
import userReducer from './userReducer';

let reducers = combineReducers({
    cartReducer: cartReducer,
    userReducer: userReducer,
})

const rootReducer = (state, action) =>{
    return reducers(state, action);
}

export default rootReducer;