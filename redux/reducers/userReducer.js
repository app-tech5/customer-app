
let userReducer = (state={}, action)=>{

    switch (action.type){

        case "ADD_USER": {
        return {...state, ...action.payload}
        }
        case "UPDATE_USER": {
            return {...state, ...action.payload}
            }
        default:
        return state
    }
}

export default userReducer;