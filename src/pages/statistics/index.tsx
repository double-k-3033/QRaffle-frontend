import { TrendingUp, Flame, Heart, Trophy, Users, Zap, DollarSign } from "lucide-react";
import { PageTransition, FadeInWhenVisible, StaggerChildren, StaggerItem } from "@/components/animations";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/sc.service";
import { useAtom } from "jotai";
import { tickInfoAtom } from "@/store/rpc";

const Statistics: React.FC = () => {
  const {
    isLoading,
    isError,
    error,
    data: analytics,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(),
  });

  // const weeklyData = [
  //   { week: "Week 1", burned: "180M", dividends: "54M", charity: "18M" },
  //   { week: "Week 2", burned: "220M", dividends: "66M", charity: "22M" },
  //   { week: "Week 3", burned: "195M", dividends: "58.5M", charity: "19.5M" },
  //   { week: "Week 4", burned: "250M", dividends: "75M", charity: "25M" },
  // ];

  const statisticsStructuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Qraffle Platform Statistics",
    description: "Comprehensive statistics showing Qraffle's impact on the Qubic ecosystem",
    url: "https://qraffle.com/statistics",
    keywords: ["qubic", "raffles", "statistics", "token burning", "charity", "dividends"],
    creator: {
      "@type": "Organization",
      name: "Qraffle",
    },
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "Qubic Ecosystem Data",
    },
    measurementTechnique: "Blockchain Analytics",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Total QUBIC Burned",
        value: analytics?.totalBurnAmount ?? 0,
        description: "Total amount of QUBIC tokens permanently removed from circulation",
      },
      {
        "@type": "PropertyValue",
        name: "Total Dividends Paid",
        value: analytics?.totalShareholderAmount ?? 0,
        description: "Total dividends distributed to registered DAO members",
      },
      {
        "@type": "PropertyValue",
        name: "Charity Donations",
        value: analytics?.totalCharityAmount ?? 0,
        description: "Total amount donated to charitable causes",
      },
    ],
  };

  const [tickInfo] = useAtom(tickInfoAtom);

  const formatNumber = (value: number) => value.toLocaleString();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-muted-foreground text-lg">Loading statistics...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-error-40 text-lg">
          Failed to load statistics: {error instanceof Error ? error.message : "Unknown error"}
        </span>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Qraffle Statistics - Platform Impact & Qubic Ecosystem Data"
        description="View comprehensive Qraffle statistics: 2.4B QU burned, 1.8B dividends paid, 650M donated to charity, 15,400+ participants. Real-time platform impact data."
        keywords="qraffle statistics, qubic ecosystem data, token burning stats, charity donations, platform metrics, blockchain analytics"
        url="/statistics"
        structuredData={statisticsStructuredData}
      />
      <PageTransition className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <FadeInWhenVisible delay={0.2}>
            <div className="mb-12 text-center">
              <h1 className="text-foreground mb-4 text-4xl font-bold">Platform Statistics</h1>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Comprehensive data showing Qraffle's impact on the Qubic ecosystem and community
              </p>
            </div>
          </FadeInWhenVisible>

          {/* Main Stats Grid */}
          <StaggerChildren staggerDelay={0.1} className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Flame className="text-error-40 mx-auto mb-3 h-8 w-8" />
                <div className="text-foreground text-2xl font-bold">{formatNumber(analytics?.totalBurnAmount ?? 0)}</div>
                <div className="text-muted-foreground text-sm">Total QU Burned</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <TrendingUp className="mx-auto mb-3 h-8 w-8 text-[#47CD89]" />
                <div className="text-foreground text-2xl font-bold">{formatNumber(analytics?.totalShareholderAmount ?? 0)}</div>
                <div className="text-muted-foreground text-sm">Dividends Paid</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Heart className="mx-auto mb-3 h-8 w-8 text-[#8B5CF6]" />
                <div className="text-foreground text-2xl font-bold">{formatNumber(analytics?.totalCharityAmount ?? 0)}</div>
                <div className="text-muted-foreground text-sm">Donated to Charity</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Users className="text-primary mx-auto mb-3 h-8 w-8" />
                <div className="text-foreground text-2xl font-bold">{formatNumber(analytics?.numberOfRegisters ?? 0)}</div>
                <div className="text-muted-foreground text-sm">Total Registers</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Trophy className="mx-auto mb-3 h-8 w-8 text-[#F59E0B]" />
                <div className="text-foreground text-2xl font-bold">{formatNumber((tickInfo?.epoch ?? 0) - 179)}</div>
                <div className="text-muted-foreground text-sm">Raffles Completed</div>
              </div>
            </StaggerItem>
          </StaggerChildren>

          {/* Additional Stats */}
          <StaggerChildren staggerDelay={0.15} className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="mb-3 flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-[#47CD89]" />
                  <h3 className="text-foreground font-semibold">Total Prizes</h3>
                </div>
                <div className="text-foreground mb-1 text-center text-2xl font-bold">
                  {formatNumber(analytics?.totalWinnerAmount ?? 0)}
                </div>
                <div className="text-muted-foreground text-sm">QUBIC awarded to winners</div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="mb-3 flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-[#F59E0B]" />
                  <h3 className="text-foreground font-semibold">Largest Prize</h3>
                </div>
                <div className="text-foreground mb-1 text-center text-2xl font-bold">
                  {formatNumber(analytics?.lagestWinnerAmount ?? 0)}
                </div>
                <div className="text-muted-foreground text-sm">Biggest single win</div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-card border-card-border transform rounded-xl border p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="mb-3 flex items-center space-x-3">
                  <Zap className="text-accent h-6 w-6" />
                  <h3 className="text-foreground font-semibold">Weekly Burn</h3>
                </div>
                <div className="text-foreground mb-1 text-center text-2xl font-bold">
                  {formatNumber(analytics?.totalBurnAmount ?? 0)}
                </div>
                <div className="text-muted-foreground text-sm">Current week burn rate</div>
              </div>
            </StaggerItem>
          </StaggerChildren>

          {/* Weekly Breakdown */}
          {/* <FadeInWhenVisible delay={0.6}>
            <div className="bg-card border-card-border mb-12 rounded-xl border p-8 shadow-lg">
              <h2 className="text-foreground mb-6 text-2xl font-bold">Weekly Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="text-foreground px-4 py-3 text-left font-semibold">Period</th>
                      <th className="text-foreground px-4 py-3 text-right font-semibold">Burned</th>
                      <th className="text-foreground px-4 py-3 text-right font-semibold">Dividends</th>
                      <th className="text-foreground px-4 py-3 text-right font-semibold">Charity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.map((week, index) => (
                      <tr
                        key={index}
                        className="border-border/50 hover:bg-muted/50 transform border-b transition-all duration-300 hover:scale-105"
                      >
                        <td className="text-foreground px-4 py-3">{week.week}</td>
                        <td className="text-error-40 px-4 py-3 text-right font-medium">{week.burned}</td>
                        <td className="px-4 py-3 text-right font-medium text-[#47CD89]">{week.dividends}</td>
                        <td className="px-4 py-3 text-right font-medium text-[#8B5CF6]">{week.charity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeInWhenVisible> */}

          {/* Impact Summary */}
          <FadeInWhenVisible delay={0.8}>
            <div className="from-primary to-accent text-primary-foreground transform rounded-xl bg-gradient-to-r p-8 transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <h2 className="mb-4 text-3xl font-bold">Ecosystem Impact</h2>
                <p className="text-primary-foreground/80 mx-auto mb-8 max-w-2xl">
                  Qraffle is making a significant positive impact on the Qubic ecosystem through deflationary mechanics,
                  community rewards, and charitable giving.
                </p>

                <StaggerChildren staggerDelay={0.2} className="grid gap-8 md:grid-cols-3">
                  <StaggerItem>
                    <div className="transform transition-all duration-300 hover:scale-110">
                      <div className="mb-2 text-3xl font-bold">{formatNumber(analytics?.totalBurnAmount ?? 0)}</div>
                      <div className="text-primary-foreground/80">QUBIC burned annually</div>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="transform transition-all duration-300 hover:scale-110">
                      <div className="mb-2 text-3xl font-bold">{formatNumber(analytics?.totalShareholderAmount ?? 0)}</div>
                      <div className="text-primary-foreground/80">QUBIC to shareholders annually</div>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="transform transition-all duration-300 hover:scale-110">
                      <div className="mb-2 text-3xl font-bold">{formatNumber(analytics?.totalCharityAmount ?? 0)}</div>
                      <div className="text-primary-foreground/80">QUBIC to charity annually</div>
                    </div>
                  </StaggerItem>
                </StaggerChildren>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </PageTransition>
    </>
  );
};

export default Statistics;
