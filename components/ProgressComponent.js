import { View, Text, TouchableOpacity } from 'react-native'
import React, { useRef } from 'react'
import { ProgressStep, ProgressSteps } from 'react-native-progress-steps'
import i18n from '../lang/i18n'

export default function ProgressComponent() {
  const progressStep = useRef(null)
  const progressSteps = useRef(null)

  return (
    <View style={{ flex: 1 }}>
      <ProgressSteps ref={progressSteps}>
        <ProgressStep label="First Step" ref={progressStep}>
          <View style={{ alignItems: 'center' }}>
            <Text>{i18n.t('progress.step1Content')}</Text>
          </View>
        </ProgressStep>
        <ProgressStep label="Second Step">
          <View style={{ alignItems: 'center' }}>
            <Text>{i18n.t('progress.step2Content')}</Text>
          </View>
        </ProgressStep>
        <ProgressStep label="Third Step">
          <View style={{ alignItems: 'center' }}>
            <Text>{i18n.t('progress.step3Content')}</Text>
          </View>
        </ProgressStep>
        <ProgressStep label="Third Step">
          <View style={{ alignItems: 'center' }}>
            <Text>{i18n.t('progress.step3Content')}</Text>
          </View>
        </ProgressStep>
      </ProgressSteps>
      <TouchableOpacity onPress={() => progressStep.current?.onNext?.()}>
        <Text>{i18n.t('progress.press')}</Text>
      </TouchableOpacity>
    </View>
  )
}