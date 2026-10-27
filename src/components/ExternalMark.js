import { FiArrowUpRight } from 'react-icons/fi'

// Small ↗ after a link that opens another website in a new tab
export default function ExternalMark() {
  return (
    <>
      <FiArrowUpRight className="ext-mark" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </>
  )
}
