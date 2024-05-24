import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { Navbar } from './components';
import { CampaignDetails, CreateCampaign, UpdateCampaign , Home ,Discussion,  theme } from './pages';

const App = () => {
  return (
    <div className="relative sm:-8 p-4 bg-bg min-h-screen flex flex-row">
      <div className="flex-1 max-sm:w-full md:basis-3/6 mx-auto sm:pr-5">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          <Route path="/campaign-update/:id" element={<UpdateCampaign />} />
          <Route path="/Discussion" element={<Discussion />} />
          <Route path="/theme" element={<theme />} />
        </Routes>
      </div>
    </div>
  )
}

export default App