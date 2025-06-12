import React from 'react';
import { ThemeProvider } from './ThemeProvider/index.js';
import { Button } from './button/index.tsx';
import { Card } from './card/index.tsx';
import { Input } from './input/index.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select/index.tsx';
import { Progress } from './progress/index.tsx';
import { List, ListItem } from './list/index.tsx';
import { Avatar, AvatarImage, AvatarFallback } from './avatar/index.tsx';
import { Tooltip } from './tooltip/index.tsx';
import { Skeleton } from './skeleton/index.tsx';
import { DateRangePicker } from './date-range-picker/index.tsx';
import { Dialog } from './dialog/index.tsx';
import { Modal } from './modal/index.tsx';
import { Toast } from './toast/index.tsx';
import { useToast } from './use-toast.tsx';
import { Toaster } from './toast.tsx';
import { ErrorBoundary } from './ErrorBoundary/index.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';
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
} from './types.tsx';

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
