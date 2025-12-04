import React from 'react';
import { Control, FieldPath, FieldValues, UseFormReturn, ControllerRenderProps } from 'react-hook-form';
declare const useFormField: () => {
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
declare const Form: <TFieldValues extends FieldValues = FieldValues>({ form, children, onSubmit, ...props }: {
    form: UseFormReturn<TFieldValues>;
    children: React.ReactNode;
    onSubmit?: (data: TFieldValues) => void;
} & React.FormHTMLAttributes<HTMLFormElement>) => import("react/jsx-runtime").JSX.Element;
declare const FormField: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ control, name, render, }: {
    control: Control<TFieldValues, TName>;
    name: TName;
    render: ({ field }: {
        field: ControllerRenderProps<TFieldValues, TName>;
    }) => React.ReactElement;
}) => import("react/jsx-runtime").JSX.Element;
declare const FormItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const FormLabel: React.ForwardRefExoticComponent<React.LabelHTMLAttributes<HTMLLabelElement> & React.RefAttributes<HTMLLabelElement>>;
declare const FormControl: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const FormDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const FormMessage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, };
