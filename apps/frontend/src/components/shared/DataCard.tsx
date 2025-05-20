"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCard = DataCard;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
function DataCard({ title, subtitle, tooltip, data, isLoading, loadingMessage = 'Loading...', hasError, errorMessage, onRefresh, actions, expandable = false, defaultExpanded = true, renderContent, sx, className }) {
    const [expanded, setExpanded] = react_1.default.useState(defaultExpanded);
    const handleExpandClick = () => {
        setExpanded(!expanded);
    };
    return (<material_1.Card sx={Object.assign({}, sx)} className={className}>
            <material_1.CardHeader title={<material_1.Box display="flex" alignItems="center" gap={1}>
                        <material_1.Typography variant="h6">{title}</material_1.Typography>
                        {tooltip && (<material_1.Tooltip title={tooltip}>
                                <icons_material_1.Info fontSize="small" color="action"/>
                            </material_1.Tooltip>)}
                    </material_1.Box>} subheader={subtitle} action={<material_1.Box display="flex" alignItems="center" gap={1}>
                        {onRefresh && (<material_1.Tooltip title="Refresh">
                                <material_1.IconButton onClick={onRefresh} size="small">
                                    <icons_material_1.Refresh />
                                </material_1.IconButton>
                            </material_1.Tooltip>)}
                        {expandable && (<material_1.Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                                <material_1.IconButton onClick={handleExpandClick} size="small">
                                    {expanded ? <icons_material_1.ExpandLess /> : <icons_material_1.ExpandMore />}
                                </material_1.IconButton>
                            </material_1.Tooltip>)}
                    </material_1.Box>}/>

            <material_1.Collapse in={!expandable || expanded}>
                <material_1.CardContent>
                    {isLoading ? (<material_1.Box display="flex" justifyContent="center" alignItems="center" p={3}>
                            <material_1.CircularProgress size={24}/>
                            <material_1.Typography variant="body2" color="textSecondary" ml={2}>
                                {loadingMessage}
                            </material_1.Typography>
                        </material_1.Box>) : hasError ? (<material_1.Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage || 'An error occurred'}
                        </material_1.Alert>) : data ? (renderContent(data)) : (<material_1.Typography color="textSecondary" align="center">
                            No data available
                        </material_1.Typography>)}
                </material_1.CardContent>

                {actions && (<material_1.CardActions sx={{ justifyContent: 'flex-end' }}>
                        {actions}
                    </material_1.CardActions>)}
            </material_1.Collapse>
        </material_1.Card>);
}
export {};
//# sourceMappingURL=DataCard.js.map