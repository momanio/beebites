import {
  useDocumentOperation,
  useFormValue,
  type StringInputProps,
} from 'sanity'

export function ProductCategoryInput(props: StringInputProps) {
  const documentId = useFormValue(['_id'])
  const legacyCategory = useFormValue(['category'])
  const { patch } = useDocumentOperation(
    typeof documentId === 'string' ? documentId.replace(/^drafts\./, '') : '',
    'product',
  )

  const onChange: StringInputProps['onChange'] = (event) => {
    props.onChange(event)
    // Replacing a legacy reference also removes references to unpublished sections.
    if (legacyCategory && !patch.disabled) patch.execute([{ unset: ['category'] }])
  }

  return props.renderDefault({ ...props, onChange })
}
