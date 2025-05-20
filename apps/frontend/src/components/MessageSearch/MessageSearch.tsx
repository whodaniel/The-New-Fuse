"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import icons_material_1 from '@mui/icons-material';
import use_debounce_1 from 'use-debounce';
import axios_1 from 'axios';
import ui_1 from '../../shared/components/ui.js';
import ui_2 from '../../shared/components/ui.js';
const MessageSearch = () => {
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [searchResults, setSearchResults] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [debouncedSearchTerm] = (0, use_debounce_1.useDebounce)(searchTerm, 500);
    (0, react_1.useEffect)(() => {
        const fetchSearchResults = async () => {
            if (debouncedSearchTerm) {
                setIsLoading(true);
                try {
                    const response = await axios_1.default.get(`/api/chat/search?q=${debouncedSearchTerm}`);
                    setSearchResults(response.data.data);
                }
                catch (error) {
                    console.error('Error fetching search results:', error);
                }
                finally {
                    setIsLoading(false);
                }
            }
            else {
                setSearchResults([]);
            }
        };
        fetchSearchResults();
    }, [debouncedSearchTerm]);
    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    };
    return (<ui_1.Card variant="default" className="w-full max-w-2xl mx-auto">
      <ui_1.CardHeader>
        <div className="flex items-center space-x-2">
          <icons_material_1.Search className="text-gray-400"/>
          <ui_2.Label>Search Messages</ui_2.Label>
        </div>
        <div className="mt-2">
          <input type="text" placeholder="Search messages..." value={searchTerm} onChange={handleSearchTermChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
      </ui_1.CardHeader>

      <ui_1.CardContent>
        {isLoading ? (<div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
          </div>) : searchResults.length > 0 ? (<div className="space-y-4">
            {searchResults.map((message) => (<div key={message.id} className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {message.sender.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {message.sender}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>))}
          </div>) : searchTerm ? (<p className="text-center text-gray-500 py-8">No messages found</p>) : (<p className="text-center text-gray-500 py-8">
            Start typing to search messages
          </p>)}
      </ui_1.CardContent>
    </ui_1.Card>);
};
exports.default = MessageSearch;
export {};
//# sourceMappingURL=MessageSearch.js.map