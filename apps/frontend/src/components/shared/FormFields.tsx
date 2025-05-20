
export {}
exports.FormTextField = FormTextField;
exports.FormSelectField = FormSelectField;
exports.FormCheckboxField = FormCheckboxField;
exports.FormSwitchField = FormSwitchField;
exports.FormSliderField = FormSliderField;
exports.FormAutocompleteField = FormAutocompleteField;
exports.FormArrayField = FormArrayField;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
function FormTextField({ name, label, value, type = 'text', required, disabled, error, helperText, multiline, rows, placeholder, autoComplete, onChange, sx }): any {
    const [showPassword, setShowPassword] = react_1.default.useState(false);
    return (<material_1.TextField fullWidth name={name} label={label} value={value} type={type === 'password' && showPassword ? 'text' : type} required={required} disabled={disabled} error={error} helperText={helperText} multiline={multiline} rows={rows} placeholder={placeholder} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} sx={sx} InputProps={type === 'password' ? {
            endAdornment: (<material_1.InputAdornment position="end">
                        <material_1.IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
                        </material_1.IconButton>
                    </material_1.InputAdornment>)
        } : undefined}/>);
}
function FormSelectField({ name, label, value, options, multiple, required, disabled, error, helperText, onChange, sx }): any {
    return (<material_1.FormControl fullWidth error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.InputLabel>{label}</material_1.InputLabel>
            <material_1.Select name={name} value={value} multiple={multiple} onChange={(e) => onChange(e.target.value)} label={label}>
                {options.map((option) => (<material_1.MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </material_1.MenuItem>))}
            </material_1.Select>
            {helperText && <material_1.FormHelperText>{helperText}</material_1.FormHelperText>}
        </material_1.FormControl>);
}
function FormCheckboxField({ name, label, value, required, disabled, error, helperText, onChange, sx }): any {
    return (<material_1.FormControl error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.FormControlLabel control={<material_1.Checkbox name={name} checked={value} onChange={(e) => onChange(e.target.checked)}/>} label={label}/>
            {helperText && <material_1.FormHelperText>{helperText}</material_1.FormHelperText>}
        </material_1.FormControl>);
}
function FormSwitchField({ name, label, value, required, disabled, error, helperText, onChange, sx }): any {
    return (<material_1.FormControl error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.FormControlLabel control={<material_1.Switch name={name} checked={value} onChange={(e) => onChange(e.target.checked)}/>} label={label}/>
            {helperText && <material_1.FormHelperText>{helperText}</material_1.FormHelperText>}
        </material_1.FormControl>);
}
function FormSliderField({ name, label, value, min = 0, max = 100, step = 1, marks, valueLabelDisplay = 'auto', required, disabled, error, helperText, onChange, sx }): any {
    return (<material_1.FormControl fullWidth error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.Typography gutterBottom>{label}</material_1.Typography>
            <material_1.Slider name={name} value={value} min={min} max={max} step={step} marks={marks} valueLabelDisplay={valueLabelDisplay} onChange={(_, value) => onChange(value)}/>
            {helperText && <material_1.FormHelperText>{helperText}</material_1.FormHelperText>}
        </material_1.FormControl>);
}
function FormAutocompleteField({ name, label, value, options, multiple, freeSolo, placeholder, required, disabled, error, helperText, onChange, sx }): any {
    return (<material_1.FormControl fullWidth error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.Autocomplete multiple={multiple} freeSolo={freeSolo} options={options} value={value} onChange={(_, value) => onChange(value)} renderInput={(params) => (<material_1.TextField {...params} name={name} label={label} placeholder={placeholder} error={error} helperText={helperText}/>)} renderTags={(value, getTagProps) => value.map((option, index) => (<material_1.Chip variant="outlined" label={option} {...getTagProps({ index })}/>))}/>
        </material_1.FormControl>);
}
function FormArrayField({ name, label, value, renderField, addLabel = 'Add Item', removeLabel = 'Remove', required, disabled, error, helperText, onChange, sx }): any {
    const handleAdd = (): any => {
        onChange([...value, null]);
    };
    const handleRemove = (index): any => {
        onChange(value.filter((_, i) => i !== index));
    };
    const handleChange = (index, newValue): any => {
        onChange(value.map((v, i) => i === index ? newValue : v));
    };
    return (<material_1.FormControl fullWidth error={error} required={required} disabled={disabled} sx={sx}>
            <material_1.Typography gutterBottom>{label}</material_1.Typography>
            <material_1.Stack spacing={2}>
                {value.map((item, index) => (<material_1.Box key={index} display="flex" alignItems="center" gap={1}>
                        {renderField(item, index)}
                        <material_1.IconButton onClick={() => handleRemove(index)} color="error" title={removeLabel}>
                            <icons_material_1.Remove />
                        </material_1.IconButton>
                    </material_1.Box>))}
                <material_1.Button startIcon={<icons_material_1.Add />} onClick={handleAdd} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                    {addLabel}
                </material_1.Button>
            </material_1.Stack>
            {helperText && <material_1.FormHelperText>{helperText}</material_1.FormHelperText>}
        </material_1.FormControl>);
}
export {};
//# sourceMappingURL=FormFields.js.map