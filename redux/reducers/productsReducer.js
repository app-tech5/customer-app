
let productsReducer = (state=[], action)=>{

    switch (action.type){

        case "ADD_PRODUCTS": {
        return {...state, ...action.payload}
        }

        default:
        return state
    }
}

export default userReducer;