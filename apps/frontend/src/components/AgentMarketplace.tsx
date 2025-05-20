import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
const BidDialog = ({ listing, onBid, onClose }) => {
    const [amount, setAmount] = useState(listing.currentBid ? listing.currentBid + 1 : listing.price);
    const { toast } = useToast();
    const handleSubmit = (e) => {
        e.preventDefault();
        if (amount <= (listing.currentBid || 0)) {
            toast({
                title: 'Invalid bid amount',
                description: 'Bid must be higher than the current bid',
                variant: 'destructive',
            });
            return;
        }
        onBid(amount);
        onClose();
    };
    return (<DialogContent>
      <DialogHeader>
        <DialogTitle>Place a Bid</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Bid Amount</Label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={listing.currentBid ? listing.currentBid + 1 : listing.price} step={1}/>
        </div>
        <Button type="submit">Place Bid</Button>
      </form>
    </DialogContent>);
};
export const AgentMarketplace = () => {
    const [listings, setListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const handleBid = async (amount) => {
        if (!selectedListing)
            return;
        try {
            setIsLoading(true);
            toast({
                title: 'Bid placed successfully',
                description: `You placed a bid of ${amount} on ${selectedListing.name}`,
            });
            setListings(listings.map(listing => listing.id === selectedListing.id
                ? Object.assign(Object.assign({}, listing), { currentBid: amount }) : listing));
        }
        catch (error) {
            toast({
                title: 'Failed to place bid',
                description: 'An error occurred while placing your bid',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handlePurchase = async (listing) => {
        try {
            setIsLoading(true);
            toast({
                title: 'Purchase successful',
                description: `You purchased ${listing.name}`,
            });
        }
        catch (error) {
            toast({
                title: 'Failed to purchase',
                description: 'An error occurred while processing your purchase',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    if (isLoading) {
        return (<div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Agent Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (<Card key={listing.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{listing.name}</CardTitle>
                <Badge variant={listing.isAuction ? 'secondary' : 'default'}>
                  {listing.isAuction ? 'Auction' : 'Fixed Price'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {listing.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {listing.capabilities.map((capability) => (<Badge key={capability} variant="outline">
                    {capability}
                  </Badge>))}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {listing.isAuction
                ? `Current Bid: ${listing.currentBid || listing.price}`
                : `Price: ${listing.price}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seller: {listing.seller.name}
                  </p>
                </div>
                {listing.isAuction ? (<Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedListing(listing)} disabled={isLoading}>
                        Place Bid
                      </Button>
                    </DialogTrigger>
                    {selectedListing && (<BidDialog listing={selectedListing} onBid={handleBid} onClose={() => setSelectedListing(null)}/>)}
                  </Dialog>) : (<Button onClick={() => handlePurchase(listing)} disabled={isLoading}>
                    Purchase
                  </Button>)}
              </div>
            </CardContent>
          </Card>))}
      </div>
    </div>);
};
//# sourceMappingURL=AgentMarketplace.js.map