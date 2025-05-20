Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceCard = void 0;
import react_1 from 'react';
import lucide_react_1 from 'lucide-react';
import Card_1 from '../ui/Card/Card.js';
import Button_1 from '../ui/Button/Button.js';
const MarketplaceCard = ({ item, onPurchase, onPreview, }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };
    return (<Card_1.Card className="hover:shadow-lg transition-shadow duration-200">
      <Card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Card_1.CardTitle>{item.name}</Card_1.CardTitle>
            <Card_1.CardDescription>{item.description}</Card_1.CardDescription>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500">
            <lucide_react_1.Star className="h-4 w-4 fill-current"/>
            <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
          </div>
        </div>
      </Card_1.CardHeader>
      <Card_1.CardContent>
        <div className="space-y-4">
          
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (<span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <lucide_react_1.Tag className="w-3 h-3 mr-1"/>
                {tag}
              </span>))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Downloads
              </div>
              <div className="mt-1 font-semibold flex items-center justify-center">
                <lucide_react_1.Download className="w-4 h-4 mr-1"/>
                {item.downloads.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Price
              </div>
              <div className="mt-1 font-semibold">
                {formatPrice(item.price)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium">
                {item.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium">{item.author.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Author
              </div>
            </div>
          </div>
        </div>
      </Card_1.CardContent>
      <Card_1.CardFooter className="flex justify-between">
        <Button_1.Button variant="outline" size="sm" onClick={() => onPreview(item)}>
          Preview
        </Button_1.Button>
        <Button_1.Button size="sm" onClick={() => onPurchase(item)}>
          {item.price === 0 ? 'Install' : `Buy ${formatPrice(item.price)}`}
        </Button_1.Button>
      </Card_1.CardFooter>
    </Card_1.Card>);
};
exports.MarketplaceCard = MarketplaceCard;
export {};
//# sourceMappingURL=MarketplaceCard.js.map