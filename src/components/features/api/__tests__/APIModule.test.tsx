import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { APIDocumentation } from '../APIModule.js';
describe("APIDocumentation", () => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
const mockEndpoints = [];
{
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    id: "1",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    name: "Get Users",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    method: "GET",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    path: "/api/users",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    description: "Get all users",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    parameters: [],
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    responses: {
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        "200";
        {
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            description: "Success",
            ;
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            schema: {
                users: [];
            }
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
            import React, { FC } from 'react';
        }
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
        import React, { FC } from 'react';
    }
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
it("renders endpoint list", () => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
render(<APIDocumentation endpoints={mockEndpoints}/>);
expect(screen.getByText("Get Users")).toBeInTheDocument();
;
it("filters endpoints by search", () => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
render(<APIDocumentation endpoints={mockEndpoints}/>);
const searchInput = screen.getByPlaceholderText();
"Search endpoints...",
;
;
fireEvent.change(searchInput, { target: { value: "users" } });
expect(screen.getByText("Get Users")).toBeInTheDocument();
;
it("shows endpoint details when selected", async (): Promise<void> {) => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
render(<APIDocumentation endpoints={mockEndpoints}/>);
fireEvent.click(screen.getByText("Get Users"));
await waitFor(() => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
expect(screen.getByText("Description")).toBeInTheDocument();
expect(screen.getByText("Get all users")).toBeInTheDocument();
;
;
;
describe("TryEndpoint", () => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
const mockEndpoint = {
    import: React,
}, { FC }, from;
'react';
id: "1",
;
method: "GET",
;
path: "/api/test",
;
parameters: [];
{
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    name: "id",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    type: "string",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    required: true,
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    description: "User ID",
    ;
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
    import React, { FC } from 'react';
}
;
it("handles successful API calls", async (): Promise<void> {) => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
const mockResponse = { data: { success: true } };
jest.spyOn(api, "request").mockResolvedValue(mockResponse);
render(<TryEndpoint endpoint={mockEndpoint}/>);
fireEvent.change(screen.getByPlaceholderText("User ID"), {
    import: React,
}, { FC }, from, 'react');
target: {
    value: "123";
}
;
fireEvent.click(screen.getByText("Send Request"));
await waitFor(() => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
expect(screen.getByText(/"success": true/)).toBeInTheDocument();
;
;
it("handles API errors", async (): Promise<void> {) => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
jest;
spyOn(api, "request");
mockRejectedValue(new Error("API Error"));
render(<TryEndpoint endpoint={mockEndpoint}/>);
fireEvent.click(screen.getByText("Send Request"));
await waitFor(() => , JSX.Element, {
    import: React,
}, { FC }, from, 'react');
expect(screen.getByText("API Error")).toBeInTheDocument();
;
;
;
export {};
