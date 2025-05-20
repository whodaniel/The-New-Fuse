"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
import react_1 from 'react';
import AuthContext_1 from '@/contexts/AuthContext';
import ThemeContext_1 from '@/contexts/ThemeContext';
import zod_1 from 'zod';
import react_hook_form_1 from 'react-hook-form';
import zod_2 from '@hookform/resolvers/zod';
import react_toastify_1 from 'react-toastify';
import Button_1 from '@/components/ui/Button';
import Input_1 from '@/components/ui/Input';
import Card_1 from '@/components/ui/Card';
import Avatar_1 from '@/components/ui/Avatar';
import Switch_1 from '@/components/ui/Switch';
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    bio: zod_1.z.string().max(200, 'Bio must be less than 200 characters').optional(),
    company: zod_1.z.string().optional(),
    website: zod_1.z.string().url('Invalid URL').optional(),
    location: zod_1.z.string().optional(),
    notifications: zod_1.z.object({
        email: zod_1.z.boolean(),
        push: zod_1.z.boolean(),
        workflow: zod_1.z.boolean(),
    }),
    preferences: zod_1.z.object({
        theme: zod_1.z.enum(['light', 'dark', 'system']),
        language: zod_1.z.enum(['en', 'es', 'fr', 'de']),
        timezone: zod_1.z.string(),
    }),
});
const Profile = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const { user, updateProfile } = (0, AuthContext_1.useAuth)();
    const { theme, setTheme } = (0, ThemeContext_1.useTheme)();
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [avatarUrl, setAvatarUrl] = (0, react_1.useState)(null);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const { register, handleSubmit, reset, formState: { errors, isDirty }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_2.zodResolver)(profileSchema),
        defaultValues: {
            name: (user === null || user === void 0 ? void 0 : user.name) || '',
            email: (user === null || user === void 0 ? void 0 : user.email) || '',
            bio: (user === null || user === void 0 ? void 0 : user.bio) || '',
            company: (user === null || user === void 0 ? void 0 : user.company) || '',
            website: (user === null || user === void 0 ? void 0 : user.website) || '',
            location: (user === null || user === void 0 ? void 0 : user.location) || '',
            notifications: {
                email: (_b = (_a = user === null || user === void 0 ? void 0 : user.notifications) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : true,
                push: (_d = (_c = user === null || user === void 0 ? void 0 : user.notifications) === null || _c === void 0 ? void 0 : _c.push) !== null && _d !== void 0 ? _d : true,
                workflow: (_f = (_e = user === null || user === void 0 ? void 0 : user.notifications) === null || _e === void 0 ? void 0 : _e.workflow) !== null && _f !== void 0 ? _f : true,
            },
            preferences: {
                theme: ((_g = user === null || user === void 0 ? void 0 : user.preferences) === null || _g === void 0 ? void 0 : _g.theme) || 'system',
                language: ((_h = user === null || user === void 0 ? void 0 : user.preferences) === null || _h === void 0 ? void 0 : _h.language) || 'en',
                timezone: ((_j = user === null || user === void 0 ? void 0 : user.preferences) === null || _j === void 0 ? void 0 : _j.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        },
    });
    (0, react_1.useEffect)(() => {
        if (user === null || user === void 0 ? void 0 : user.avatarUrl) {
            setAvatarUrl(user.avatarUrl);
        }
    }, [user === null || user === void 0 ? void 0 : user.avatarUrl]);
    const handleAvatarUpload = async () => ;
    () => ;
    (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok)
                throw new Error('Failed to upload avatar');
            const { url } = await response.json();
            setAvatarUrl(url);
            react_toastify_1.toast.success('Avatar updated successfully');
        }
        catch (error) {
            react_toastify_1.toast.error('Failed to upload avatar');
            console.error('Avatar upload error:', error);
        }
        finally {
            setIsUploading(false);
        }
    };
    const onSubmit = async () => ;
    () => ;
    (data) => {
        try {
            await updateProfile(Object.assign(Object.assign({}, data), { avatarUrl }));
            setIsEditing(false);
            react_toastify_1.toast.success('Profile updated successfully');
        }
        catch (error) {
            react_toastify_1.toast.error('Failed to update profile');
            console.error('Profile update error:', error);
        }
    };
    const handleCancel = () => {
        setIsEditing(false);
        reset();
    };
    return className = "max-w-2xl mx-auto p-6 space-y-6" >
        className;
    "flex items-center justify-between" >
        className;
    "text-2xl font-bold" > Profile;
    Settings < /h2>;
    {
        !isEditing && onClick;
        {
            () => setIsEditing(true);
        }
        variant = "outline" >
            Edit;
        Profile
            < /Button_1.Button>;
    }
    /div>
        < div;
    className = "flex items-center space-x-4" >
        src;
    {
        avatarUrl || (user === null || user === void 0 ? void 0 : user.avatarUrl);
    }
    alt = {}(user === null || user === void 0 ? void 0 : user.name) || 'Profile';
}, size = "lg", className = "cursor-pointer" /  >
    { isEditing } && type;
"file";
accept = "image/*";
onChange = { handleAvatarUpload };
className = "hidden";
id = "avatar-upload" /  >
    htmlFor;
"avatar-upload" >
    variant;
"outline";
disabled = { isUploading };
className = "cursor-pointer" >
    { isUploading, 'Uploading...': 'Change Avatar' }
    < /Button_1.Button>
    < /label>
    < /div>;
/div>
    < form;
onSubmit = {};
className = "space-y-6" >
    className;
"grid grid-cols-1 md:grid-cols-2 gap-6" >
    label;
"Name";
{
    register('name');
}
error = {}(_k = errors.name) === null || _k === void 0 ? void 0 : _k.message;
disabled = {};
isEditing;
/>
    < /div>
    < div >
    label;
"Email";
{
    register('email');
}
error = {}(_l = errors.email) === null || _l === void 0 ? void 0 : _l.message;
disabled = {};
isEditing;
/>
    < /div>
    < div;
className = "md:col-span-2" >
    label;
"Bio";
{
    register('bio');
}
error = {}(_m = errors.bio) === null || _m === void 0 ? void 0 : _m.message;
disabled = {};
isEditing;
multiline;
rows = { 3:  } /  >
    /div>
    < div >
    label;
"Company";
{
    register('company');
}
error = {}(_o = errors.company) === null || _o === void 0 ? void 0 : _o.message;
disabled = {};
isEditing;
/>
    < /div>
    < div >
    label;
"Website";
{
    register('website');
}
error = {}(_p = errors.website) === null || _p === void 0 ? void 0 : _p.message;
disabled = {};
isEditing;
/>
    < /div>
    < div >
    label;
"Location";
{
    register('location');
}
error = {}(_q = errors.location) === null || _q === void 0 ? void 0 : _q.message;
disabled = {};
isEditing;
/>
    < /div>
    < /div>
    < div;
className = "space-y-4" >
    className;
"text-lg font-semibold" > Notifications < /h3>
    < div;
className = "space-y-2" >
    label;
"Email Notifications";
{
    register('notifications.email');
}
disabled = {};
isEditing;
/>
    < Switch_1.Switch;
label = "Push Notifications";
{
    register('notifications.push');
}
disabled = {};
isEditing;
/>
    < Switch_1.Switch;
label = "Workflow Updates";
{
    register('notifications.workflow');
}
disabled = {};
isEditing;
/>
    < /div>
    < /div>
    < div;
className = "space-y-4" >
    className;
"text-lg font-semibold" > Preferences < /h3>
    < div;
className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
    { ...register('preferences.theme') };
className = "form-select";
disabled = {};
isEditing;
onChange = {}(e);
{
    register('preferences.theme').onChange(e);
    setTheme(e.target.value);
}
 >
    value;
"light" > Light;
Theme < /option>
    < option;
value = "dark" > Dark;
Theme < /option>
    < option;
value = "system" > System;
Theme < /option>
    < /select>
    < select;
{
    register('preferences.language');
}
className = "form-select";
disabled = {};
isEditing;
 >
    value;
"en" > English < /option>
    < option;
value = "es" > Español < /option>
    < option;
value = "fr" > Français < /option>
    < option;
value = "de" > Deutsch < /option>
    < /select>
    < /div>
    < /div>;
{
    isEditing && className;
    "flex justify-end space-x-4" >
        type;
    "button";
    variant = "outline";
    onClick = { handleCancel } >
        Cancel
        < /Button_1.Button>
        < Button_1.Button;
    type = "submit";
    disabled = {};
    isDirty;
}
 >
    Save;
Changes
    < /Button_1.Button>
    < /div>;
/form>
    < /Card_1.Card>;
;
;
exports.Profile = Profile;
//# sourceMappingURL=Profile.js.map