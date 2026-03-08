import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Achievements from '../../src/components/Achievements/Achievements';
import { renderWithProviders } from '../utils';
import { mockAchievement, mockAchievementNoDescription } from '../fixtures';

describe('Achievements', () => {
  it('renders no achievements message when achievements is empty', () => {
    renderWithProviders(<Achievements achievements={[]} />);
    expect(screen.getByText('No achievements available')).toBeInTheDocument();
  });

  it('renders no achievements message when achievements is undefined', () => {
    renderWithProviders(<Achievements />);
    expect(screen.getByText('No achievements available')).toBeInTheDocument();
  });

  it('renders achievement title', () => {
    renderWithProviders(<Achievements achievements={[mockAchievement]} />);
    expect(screen.getByText(mockAchievement.title)).toBeInTheDocument();
  });

  it('renders achievement date', () => {
    renderWithProviders(<Achievements achievements={[mockAchievement]} />);
    expect(screen.getByText(/2022/)).toBeInTheDocument();
  });

  it('renders achievement description when provided', () => {
    renderWithProviders(<Achievements achievements={[mockAchievement]} />);
    expect(screen.getByText(mockAchievement.description!)).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    renderWithProviders(<Achievements achievements={[mockAchievementNoDescription]} />);
    expect(screen.queryByText('Recognised for outstanding contributions.')).not.toBeInTheDocument();
  });

  it('renders multiple achievements', () => {
    renderWithProviders(<Achievements achievements={[mockAchievement, mockAchievementNoDescription]} />);
    expect(screen.getByText(mockAchievement.title)).toBeInTheDocument();
    expect(screen.getByText(mockAchievementNoDescription.title)).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(<Achievements loading={true} />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });
});
