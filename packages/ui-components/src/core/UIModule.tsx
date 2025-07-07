import React from 'react';
import { ThemeProvider } from './ThemeProvider/index';
import { Button } from './button/index';
import { Card } from './card/index';
import { Input } from './input/index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select/index';
import { Progress } from './progress/index';
import { List, ListItem } from './list/index';
import { Avatar, AvatarImage, AvatarFallback } from './avatar/index';
import { Tooltip } from './tooltip/index';
import { Skeleton } from './skeleton/index';
import { DateRangePicker } from './date-range-picker/index';
import { Dialog } from './dialog/index';
import { Modal } from './modal/index';
import { Toast } from './toast/index';
import { useToast } from './use-toast';
import { Toaster } from './toast';
import { ErrorBoundary } from './ErrorBoundary/index';
import { LoadingSpinner } from './LoadingSpinner';
import { ProtectedRoute } from './ProtectedRoute';
import {
  ButtonProps,
  CardProps,
  InputProps,
  SelectProps,
  ProgressProps,
  ListProps,
  ListItemProps,
  AvatarProps,
  TooltipProps,
  SkeletonProps,
  DateRangePickerProps,
  DialogProps,
  ModalProps,
  ToastProps,
  ToastActionElement,
  ToastVariant,
  ToasterToast,
} from './types';

export {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  List,
  ListItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tooltip,
  Skeleton,
  DateRangePicker,
  Dialog,
  Modal,
  Toast
}

// Re-export types
export type {
  ButtonProps,
  InputProps,
  SelectProps,
  CardProps,
  DialogProps,
  ModalProps,
  ToastProps
}
