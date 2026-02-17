import React from 'react';
import * as PropTypes from 'prop-types';
import ArchaeologicalInterface from '../components/ArchaeologicalInterface';

const ArchaeologyPage = ({ fragments = [] }) => {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <ArchaeologicalInterface
        artifactId={fragments.length > 0 ? `fragment_${fragments.length}` : 'fragment_001'}
      />
    </div>
  );
};

ArchaeologyPage.propTypes = {
  fragments: PropTypes.array
};

export default ArchaeologyPage;
