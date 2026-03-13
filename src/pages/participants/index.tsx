import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageTransition, FadeInWhenVisible } from "@/components/animations";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRaffleParticipants } from "@/hooks/useRaffleParticipants";
import { truncateMiddle } from "@/utils/base.utils";
import { Users, Search } from "lucide-react";

const Participants: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEpoch = Number.parseInt(searchParams.get("epoch") ?? "", 10);
  const initialType = searchParams.get("type");
  const initialTokenRaffleIndex = Number.parseInt(searchParams.get("tokenIndex") ?? "", 10);
  const shouldAutoQuery = searchParams.get("autoQuery") === "1";

  const [epoch, setEpoch] = useState<number>(Number.isFinite(initialEpoch) && initialEpoch > 0 ? initialEpoch : 203);
  const [isTokenRaffle, setIsTokenRaffle] = useState<boolean>(initialType === "token");
  const [tokenRaffleIndex, setTokenRaffleIndex] = useState<number>(
    Number.isFinite(initialTokenRaffleIndex) && initialTokenRaffleIndex >= 0 ? initialTokenRaffleIndex : 0,
  );
  const [queryEnabled, setQueryEnabled] = useState<boolean>(false);

  const { participants, totalParticipants, totalEntries, isLoading, error } = useRaffleParticipants({
    epoch,
    isTokenRaffle,
    tokenRaffleIndex: isTokenRaffle ? tokenRaffleIndex : undefined,
    enabled: queryEnabled,
  });

  const handleQuery = () => {
    setQueryEnabled(true);
  };

  const resetQuery = () => {
    setQueryEnabled(false);
  };

  useEffect(() => {
    if (!shouldAutoQuery) return;
    setQueryEnabled(true);
  }, [shouldAutoQuery]);

  const exportToCSV = () => {
    if (participants.length === 0) return;

    const headers = ["Rank", "Wallet", "Entries", "Percentage"];
    const rows = participants.map((p, index) => {
      const percentage = ((p.entryCount / totalEntries) * 100).toFixed(2);
      return [index + 1, p.wallet, p.entryCount, percentage];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `raffle-participants-epoch${epoch}${isTokenRaffle ? `-token${tokenRaffleIndex}` : ""}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SEO
        title="Raffle Participants Query | Qraffle"
        description="Query raffle participants for any epoch"
        url="/participants"
      />

      <PageTransition className="overflow-x-hidden px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <FadeInWhenVisible delay={0.2}>
            <div className="mb-6 text-center">
              <h1 className="text-foreground mb-4 text-4xl font-bold">Raffle Participants</h1>
              <p className="text-muted-foreground mx-auto max-w-3xl">
                Query participant wallets and entry counts for any raffle
              </p>
            </div>
          </FadeInWhenVisible>

          <FadeInWhenVisible delay={0.3}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Query Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="epoch">Epoch</Label>
                    <Input
                      id="epoch"
                      type="number"
                      value={epoch}
                      onChange={(e) => {
                        setEpoch(parseInt(e.target.value));
                        resetQuery();
                      }}
                      placeholder="Enter epoch number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raffleType">Raffle Type</Label>
                    <select
                      id="raffleType"
                      value={isTokenRaffle ? "token" : "qubic"}
                      onChange={(e) => {
                        setIsTokenRaffle(e.target.value === "token");
                        resetQuery();
                      }}
                      className="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="qubic">QUBIC Raffle</option>
                      <option value="token">Token Raffle</option>
                    </select>
                  </div>
                </div>

                {isTokenRaffle && (
                  <div className="space-y-2">
                    <Label htmlFor="tokenIndex">Token Raffle Index</Label>
                    <Input
                      id="tokenIndex"
                      type="number"
                      value={tokenRaffleIndex}
                      onChange={(e) => {
                        setTokenRaffleIndex(parseInt(e.target.value));
                        resetQuery();
                      }}
                      placeholder="Enter token raffle index (0, 1, 2, etc.)"
                    />
                  </div>
                )}

                <Button onClick={handleQuery} className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Query Participants
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </FadeInWhenVisible>

          {queryEnabled && (
            <FadeInWhenVisible delay={0.4}>
              {error ? (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive text-center">
                      Error loading participants. The epoch may not have complete data yet.
                    </p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Loading participants...</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Results
                      </span>
                      <span className="text-muted-foreground text-sm font-normal">
                        Epoch {epoch} - {isTokenRaffle ? `Token Raffle #${tokenRaffleIndex}` : "QUBIC Raffle"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-wrap items-end gap-4">
                      <div className="bg-muted rounded-lg p-4 flex-1 min-w-[200px]">
                        <div className="text-muted-foreground text-sm">Total Participants</div>
                        <div className="text-foreground text-2xl font-bold">{totalParticipants}</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 flex-1 min-w-[200px]">
                        <div className="text-muted-foreground text-sm">Total Entries</div>
                        <div className="text-foreground text-2xl font-bold">{totalEntries.toLocaleString()}</div>
                      </div>
                      {participants.length > 0 && (
                        <Button onClick={exportToCSV} variant="outline" className="gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                          Export CSV
                        </Button>
                      )}
                    </div>

                    {participants.length === 0 ? (
                      <div className="text-center py-8 space-y-4">
                        <p className="text-muted-foreground">No participants found for this raffle.</p>
                        <div className="bg-muted/50 rounded-lg p-4 text-left text-sm">
                          <p className="font-semibold mb-2">Possible reasons:</p>
                          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                            <li>This raffle may not exist or had no participants</li>
                            <li>The archiver may not have transaction data for this epoch yet</li>
                            <li>Try a different epoch (e.g., 200, 201) or raffle index</li>
                            <li>For QUBIC raffles, use "QUBIC Raffle" type (not token)</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-foreground px-4 py-3 text-left text-sm font-semibold">#</th>
                              <th className="text-foreground px-4 py-3 text-left text-sm font-semibold">Wallet</th>
                              <th className="text-foreground px-4 py-3 text-right text-sm font-semibold">Entries</th>
                              <th className="text-foreground px-4 py-3 text-right text-sm font-semibold">% of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((participant, index) => {
                              const percentage = ((participant.entryCount / totalEntries) * 100).toFixed(2);
                              return (
                                <tr key={participant.wallet} className="border-b hover:bg-muted/50">
                                  <td className="text-muted-foreground px-4 py-3 text-sm">{index + 1}</td>
                                  <td className="px-4 py-3">
                                    <code className="text-foreground text-xs font-mono">
                                      {truncateMiddle(participant.wallet, 40)}
                                    </code>
                                  </td>
                                  <td className="text-foreground px-4 py-3 text-right font-medium">
                                    {participant.entryCount.toLocaleString()}
                                  </td>
                                  <td className="text-muted-foreground px-4 py-3 text-right text-sm">{percentage}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </FadeInWhenVisible>
          )}

          <FadeInWhenVisible delay={0.5}>
            <div className="bg-muted/30 mt-6 rounded-lg p-6">
              <h3 className="text-foreground mb-3 text-lg font-semibold">How to Use</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Enter an epoch number (e.g., 203 for the most recent completed epoch)</li>
                <li>• Select raffle type: QUBIC Raffle (standard) or Token Raffle</li>
                <li>• For token raffles, enter the raffle index (0, 1, 2, etc.)</li>
                <li>• Click "Query Participants" to see the list of wallets and entry counts</li>
                <li>• Results show wallet addresses, number of entries, and percentage of total entries</li>
              </ul>
            </div>
          </FadeInWhenVisible>
        </div>
      </PageTransition>
    </>
  );
};

export default Participants;
