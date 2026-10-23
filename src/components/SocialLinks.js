import { FaInstagram, FaSquareFacebook } from 'react-icons/fa6'
import { FaTripadvisor } from 'react-icons/fa'
import { helsy } from '@/data/site'
import styles from './SocialLinks.module.css'

const icons = {
  facebook: { Icon: FaSquareFacebook, label: 'Facebook' },
  instagram: { Icon: FaInstagram, label: 'Instagram' },
  tripadvisor: { Icon: FaTripadvisor, label: 'Tripadvisor' },
}

export default function SocialLinks({ links = helsy.social, className = '' }) {
  return (
    <ul className={`${styles.list} ${className}`}>
      {Object.entries(links).map(([key, href]) => {
        const { Icon, label } = icons[key]
        return (
          <li key={key}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={styles.link}>
              <Icon />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
