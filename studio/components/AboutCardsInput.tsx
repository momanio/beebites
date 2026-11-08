import { Button, Card, Stack, Text } from '@sanity/ui'
import { set, type ArrayOfObjectsInputProps } from 'sanity'
import { getDefaultAboutCards } from '../defaults'

export function AboutCardsInput(props: ArrayOfObjectsInputProps) {
  const hasCards = Boolean(props.value?.length)

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      {!hasCards && (
        <Card padding={3} radius={2} tone="primary" border>
          <Stack space={3}>
            <Text size={1} style={{ lineHeight: 1.8 }}>
              ابدأ بالبطاقات الثلاث الجاهزة، ثم عدّل العنوان والنص كما تحب.
            </Text>
            <Button
              text="إضافة البطاقات الافتراضية"
              mode="ghost"
              disabled={props.readOnly}
              onClick={() => props.onChange(set(getDefaultAboutCards()))}
            />
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
