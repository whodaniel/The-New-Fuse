import React from 'react';
import styled from '@emotion/styled';

export interface RootLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

const LayoutContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
`;

const SidebarContainer = styled.div`
  width: 280px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
`;

export const RootLayout: React.FC<RootLayoutProps> = ({ children, sidebar }) => {
  return (
    <LayoutContainer>
      {sidebar && <SidebarContainer>{sidebar}</SidebarContainer>}
      <MainContent>{children}</MainContent>
    </LayoutContainer>
  );
};
