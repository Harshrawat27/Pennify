import SwiftUI
import WidgetKit

// MARK: - Data Model

struct SpendlerEntry: TimelineEntry {
    let date: Date
    let todaySpent: Double
    let monthlySpent: Double
    let monthlyBudget: Double
    let currencySymbol: String
    let lastTxTitle: String
    let lastTxAmount: String
}

// MARK: - Data Reader

private func readData() -> SpendlerEntry {
    let defaults = UserDefaults(suiteName: "group.app.spendler")
    let todaySpent    = defaults?.double(forKey: "spendler_today_spent") ?? 0
    let monthlySpent  = defaults?.double(forKey: "spendler_monthly_spent") ?? 0
    let monthlyBudget = defaults?.double(forKey: "spendler_monthly_budget") ?? 0
    let symbol        = defaults?.string(forKey: "spendler_currency_symbol") ?? "$"
    let lastTitle     = defaults?.string(forKey: "spendler_last_tx_title") ?? ""
    let lastAmount    = defaults?.string(forKey: "spendler_last_tx_amount") ?? ""

    return SpendlerEntry(
        date: Date(),
        todaySpent: todaySpent,
        monthlySpent: monthlySpent,
        monthlyBudget: monthlyBudget,
        currencySymbol: symbol,
        lastTxTitle: lastTitle,
        lastTxAmount: lastAmount
    )
}

// MARK: - Timeline Provider

struct SpendlerProvider: TimelineProvider {
    func placeholder(in context: Context) -> SpendlerEntry {
        SpendlerEntry(date: Date(), todaySpent: 24.50, monthlySpent: 320, monthlyBudget: 500, currencySymbol: "$", lastTxTitle: "Starbucks", lastTxAmount: "$4.50")
    }

    func getSnapshot(in context: Context, completion: @escaping (SpendlerEntry) -> Void) {
        completion(readData())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SpendlerEntry>) -> Void) {
        let entry = readData()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Helpers

private func formatAmount(_ value: Double, symbol: String) -> String {
    if value >= 1000 {
        return "\(symbol)\(String(format: "%.1f", value / 1000))k"
    }
    return "\(symbol)\(String(format: "%.0f", value))"
}

private let addURL = URL(string: "spendler://add-transaction")!
private let voiceURL = URL(string: "spendler://voice-transaction")!

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: SpendlerEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Top row: Today label + add button
            HStack {
                Text("Today")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                Spacer()
                Link(destination: voiceURL) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.white.opacity(0.2))
                        .clipShape(Circle())
                }
            }

            Spacer()

            Text(formatAmount(entry.todaySpent, symbol: entry.currencySymbol))
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .minimumScaleFactor(0.7)
                .lineLimit(1)

            // Budget progress bar (only if budget set)
            if entry.monthlyBudget > 0 {
                let progress = min(entry.monthlySpent / entry.monthlyBudget, 1.0)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.white.opacity(0.2))
                            .frame(height: 3)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(progress > 0.9 ? Color.red.opacity(0.8) : Color.white)
                            .frame(width: geo.size.width * progress, height: 3)
                    }
                }
                .frame(height: 3)
                .padding(.top, 6)

                Text("\(Int((entry.monthlySpent / entry.monthlyBudget) * 100))% of \(formatAmount(entry.monthlyBudget, symbol: entry.currencySymbol))")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.top, 3)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(Color.black, for: .widget)
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: SpendlerEntry

    var body: some View {
        HStack(spacing: 0) {
            // Left: today's spending
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("Today")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    Spacer()
                    Link(destination: voiceURL) {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Circle())
                    }
                    Link(destination: addURL) {
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Circle())
                    }
                }

                Spacer()

                Text(formatAmount(entry.todaySpent, symbol: entry.currencySymbol))
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
            }
            .frame(maxHeight: .infinity, alignment: .leading)
            .padding(14)

            // Divider
            Rectangle()
                .fill(Color.white.opacity(0.1))
                .frame(width: 1)
                .padding(.vertical, 14)

            // Right: monthly budget + last transaction
            VStack(alignment: .leading, spacing: 0) {
                Text("This Month")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.white.opacity(0.5))
                    .textCase(.uppercase)
                    .padding(.bottom, 4)

                Text(formatAmount(entry.monthlySpent, symbol: entry.currencySymbol))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                if entry.monthlyBudget > 0 {
                    let progress = min(entry.monthlySpent / entry.monthlyBudget, 1.0)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white.opacity(0.15))
                                .frame(height: 3)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(progress > 0.9 ? Color.red.opacity(0.8) : Color.white.opacity(0.8))
                                .frame(width: geo.size.width * progress, height: 3)
                        }
                    }
                    .frame(height: 3)
                    .padding(.top, 5)

                    Text("of \(formatAmount(entry.monthlyBudget, symbol: entry.currencySymbol))")
                        .font(.system(size: 9))
                        .foregroundColor(.white.opacity(0.4))
                        .padding(.top, 3)
                }

                Spacer()

                // Last transaction
                if !entry.lastTxTitle.isEmpty {
                    Divider()
                        .background(Color.white.opacity(0.1))
                        .padding(.bottom, 6)

                    Text("Last")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.white.opacity(0.4))
                        .textCase(.uppercase)
                    HStack {
                        Text(entry.lastTxTitle)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Spacer()
                        Text(entry.lastTxAmount)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.top, 2)
                }
            }
            .frame(maxHeight: .infinity, alignment: .leading)
            .padding(14)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(Color.black, for: .widget)
    }
}

// MARK: - Widget Configuration

struct SpendlerWidget: Widget {
    let kind: String = "SpendlerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SpendlerProvider()) { entry in
            SpendlerWidgetView(entry: entry)
        }
        .configurationDisplayName("Spendler")
        .description("Track your daily and monthly spending.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct SpendlerWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: SpendlerEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Bundle

@main
struct SpendlerWidgetBundle: WidgetBundle {
    var body: some Widget {
        SpendlerWidget()
    }
}
