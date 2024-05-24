import { createCampaign, dashboard, logout, payment, profile, withdraw, presentation } from '../assets';

export const navLinks = [
  {
    name: 'Home',
    imgUrl: dashboard,
    link: '/',
    id: 0
  },
  {
    name: 'Start campaign',
    imgUrl: createCampaign,
    link: '/create-campaign',
    id: 1
  },
  {
    name: 'Discussions',
    imgUrl: presentation,
    link: '/Discussion',
    id: 2
  },
  // {
  //   name: 'Logout',
  //   imgUrl: logout,
  //   link: '/',
  //   disabled: true,
  //   id: 5
  // },
];
