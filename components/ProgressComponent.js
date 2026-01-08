import { View, Text, TouchableOpacity } from 'react-native'
import React, { useRef } from 'react'
import { ProgressStep, ProgressSteps } from 'react-native-progress-steps'

export default function ProgressComponent() {

    const progressStep = useRef(null)
    const progressSteps = useRef(null)
  return (
   <View style={{flex: 1}}>
    <ProgressSteps ref={progressSteps}>
        <ProgressStep label="First Step" ref={progressStep}>
            <View style={{ alignItems: 'center' }}>
                <Text>This is the content within step 1!</Text>
            </View>
        </ProgressStep>
        <ProgressStep label="Second Step">
            <View style={{ alignItems: 'center' }}>
                <Text>This is the content within step 2!</Text>
            </View>
        </ProgressStep>
        <ProgressStep label="Third Step">
            <View style={{ alignItems: 'center' }}>
                <Text>This is the content within step 3!</Text>
            </View>
        </ProgressStep>
        <ProgressStep label="Third Step">
            <View style={{ alignItems: 'center' }}>
                <Text>This is the content within step 3!</Text>
            </View>
        </ProgressStep>
    </ProgressSteps>
    <TouchableOpacity onPress={()=>console.log(progressStep.current.onNext)}>
        <Text>Appuie</Text>
    </TouchableOpacity>
</View>


  )
}